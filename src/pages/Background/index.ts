import {
  setEndRecordingStorage,
  localStorageGet,
  executeScript,
} from '../Common/utils';

const CTX_MENU_ID = 'deploysentinel-menu-id';

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
  id: CTX_MENU_ID,
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
  chrome.tabs.sendMessage(recordingTabId, { type: 'onHoverCtxMenu' });
});

localStorageGet(['recordingState']).then(({ recordingState }) => {
  if (recordingState === 'active') {
    chrome.contextMenus.update(CTX_MENU_ID, {
      enabled: true,
    });
  } else {
    chrome.contextMenus.update(CTX_MENU_ID, {
      enabled: false,
    });
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes?.recordingState?.oldValue === changes?.recordingState?.newValue) {
    return;
  }

  if (changes?.recordingState?.newValue == 'active') {
    chrome.contextMenus.update(CTX_MENU_ID, {
      enabled: true,
    });
  }
  if (changes?.recordingState?.newValue == 'finished') {
    chrome.contextMenus.update(CTX_MENU_ID, {
      enabled: false,
    });
  }
});
