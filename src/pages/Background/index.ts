import {
  setEndRecordingStorage,
  setStartRecordingStorage,
  localStorageGet,
  executeScript,
  createTab,
  isCypressBrowser,
  getCypressAutFrame,
  executeCleanUp,
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
  const { recording, recordingTabId, recordingFrameId, recordingState } =
    await localStorageGet([
      'recording',
      'recordingState',
      'recordingTabId',
      'recordingFrameId',
    ]);

  // Check if it's a parent frame, we're recording, and it's the right tabid
  if (
    frameId !== recordingFrameId ||
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

    setStartRecordingStorage(tabId, 0, newUrl, testEditorTabId);
  } else if (request.type === 'forward-recording') {
    // Focus the original deploysentinel webapp tab post-recording
    chrome.tabs.update(request.tabId, { active: true });

    chrome.tabs.sendMessage(request.tabId, {
      type: 'playwright-test-recording',
      code: request.code,
      actions: request.actions,
    });
  } else if (request.type === 'cypress-trigger-start-recording') {
    const tabId = sender.tab?.id;

    if (tabId == null) {
      throw new Error('Cypress tab not defined');
    }

    const autFrame = await getCypressAutFrame(tabId);
    const { url, frameId } = autFrame;

    setStartRecordingStorage(tabId, frameId, url);
    await executeCleanUp(tabId, frameId);
    await executeScript(tabId, frameId, 'contentScript.bundle.js');
  }
});

// Set recording as ended when the recording tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { recordingTabId } = await localStorageGet(['recordingTabId']);
  if (tabId == recordingTabId) {
    setEndRecordingStorage();
  }
});

// Cypress runner will not trigger navigation due to hash path changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const { url } = changeInfo;
  if (url && url.includes('/specs/runner?file=') && url.includes('#')) {
    // Check if it really is a cy tab
    const isCy = await isCypressBrowser(tabId);
    if (isCy) {
      await executeScript(tabId, 0, 'cypressTrigger.bundle.js');
    }
  }
});

chrome.webNavigation.onHistoryStateUpdated.addListener(onNavEvent);
chrome.webNavigation.onReferenceFragmentUpdated.addListener(onNavEvent);
chrome.webNavigation.onCommitted.addListener(onNavEvent);

chrome.webNavigation.onCompleted.addListener(async (details) => {
  const { tabId, frameId } = details;

  const { recordingTabId, recordingFrameId, recordingState } =
    await localStorageGet([
      'recordingTabId',
      'recordingFrameId',
      'recordingState',
    ]);

  if (
    frameId !== recordingFrameId ||
    tabId != recordingTabId ||
    recordingState != 'active'
  ) {
    return;
  }

  executeScript(tabId, recordingFrameId, 'contentScript.bundle.js');
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
