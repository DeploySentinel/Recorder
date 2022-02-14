import {
  setEndRecordingStorage,
  setStartRecordingStorage,
  localStorageGet,
  executeScript,
  createTab,
} from '../Common/utils';

const HOVER_CTX_MENU_ID = 'deploysentinel-menu-id';
const AWAIT_TEXT_CTX_MENU_ID = 'deploysentinel-menu-await-text-id';

async function recordNavigationEvent(
  url: string,
  transitionType: string,
  transitionQualifiers: string[],
  recording: any[]
) {
  const navigationEvent = {
    type: 'navigate',
    url,
    transitionType,
    transitionQualifiers,
  };

  const newRecording = [
    ...recording,
    {
      ...navigationEvent,
    },
  ];

  await chrome.storage.local.set({ recording: newRecording });
}

async function onNavEvent(
  details: chrome.webNavigation.WebNavigationTransitionCallbackDetails
) {
  const { tabId, url, transitionType, transitionQualifiers, frameId } = details;
  const { recording, recordingTabId, recordingState } = await localStorageGet([
    'recording',
    'recordingState',
    'recordingTabId',
  ]);

  // Check if it's a parent frame, we're recording, and it's the right tabid
  if (
    frameId !== 0 ||
    recordingState !== 'active' ||
    recordingTabId !== tabId
  ) {
    return;
  }

  await recordNavigationEvent(
    url,
    transitionType,
    transitionQualifiers,
    recording
  );
}

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.type === 'start-recording') {
    const testEditorTabId = sender.tab?.id;

    const newUrl = request.url;
    const newTab = await createTab(newUrl);
    const tabId = newTab.id;

    if (tabId == null) {
      throw new Error('New tab id not defined');
    }

    setStartRecordingStorage(tabId, newUrl, testEditorTabId);
  } else if (request.type === 'forward-recording') {
    // Focus the original deploysentinel webapp tab post-recording
    chrome.tabs.update(request.tabId, { active: true });

    chrome.tabs.sendMessage(request.tabId, {
      type: 'playwright-test-recording',
      code: request.code,
      actions: request.actions,
    });
  }
});

// Set recording as ended when the recording tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { recordingTabId } = await localStorageGet(['recordingTabId']);
  if (tabId == recordingTabId) {
    setEndRecordingStorage();
  }
});

chrome.webNavigation.onHistoryStateUpdated.addListener(onNavEvent);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(onNavEvent);
chrome.webNavigation.onCommitted.addListener(onNavEvent);

chrome.webNavigation.onCompleted.addListener(async (details) => {
  const { tabId, frameId } = details;

  if (frameId !== 0) {
    return;
  }

  const { recordingTabId, recordingState } = await localStorageGet([
    'recordingTabId',
    'recordingState',
  ]);
  if (tabId != recordingTabId || recordingState != 'active') {
    return;
  }

  executeScript(tabId, 'contentScript.bundle.js');
});

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  title: 'Record hover over element',
  contexts: ['all'],
  id: HOVER_CTX_MENU_ID,
  enabled: false,
});
chrome.contextMenus.create({
  title: 'Assert/wait for selected text',
  contexts: ['selection'],
  id: AWAIT_TEXT_CTX_MENU_ID,
  enabled: false,
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (typeof tab === 'undefined') {
    return;
  }
  const { recordingTabId } = await localStorageGet(['recordingTabId']);
  if (tab.id != recordingTabId) {
    return;
  }
  const type =
    info.menuItemId === HOVER_CTX_MENU_ID
      ? 'onHoverCtxMenu'
      : 'onAwaitTextCtxMenu';
  chrome.tabs.sendMessage(recordingTabId, {
    type,
    selectionText: info.selectionText,
  });
});

function updateContextMenuItems({ enabled }: { enabled: boolean }) {
  chrome.contextMenus.update(HOVER_CTX_MENU_ID, {
    enabled,
  });
  chrome.contextMenus.update(AWAIT_TEXT_CTX_MENU_ID, {
    enabled,
  });
}

localStorageGet(['recordingState']).then(({ recordingState }) => {
  if (recordingState === 'active') {
    updateContextMenuItems({ enabled: true });
  } else {
    updateContextMenuItems({ enabled: false });
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes?.recordingState?.oldValue === changes?.recordingState?.newValue) {
    return;
  }

  if (changes?.recordingState?.newValue == 'active') {
    updateContextMenuItems({ enabled: true });
  }
  if (changes?.recordingState?.newValue == 'finished') {
    updateContextMenuItems({ enabled: false });
  }
});
