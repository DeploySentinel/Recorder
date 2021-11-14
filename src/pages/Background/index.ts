import { setEndRecordingStorage, localStorageGet } from '../Common/utils';

const CTX_MENU_ID = 'deploysentinel-menu-id';

function getTab(tabId: number) {
  return new Promise<chrome.tabs.Tab>((resolve, reject) => {
    try {
      chrome.tabs.get(tabId, (tab) => {
        resolve(tab);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function injectContentScript(tabId: number) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['contentScript.bundle.js'],
  });
}

// Set recording as ended when the recording tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { recordingTabId } = await localStorageGet(['recordingTabId']);
  if (tabId == recordingTabId) {
    setEndRecordingStorage();
  }
});

chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: any) => {
  if (changeInfo.status === 'complete') {
    const { recordingTabId, recordingState, recording } = await localStorageGet(
      ['recordingTabId', 'recordingState', 'recording']
    );
    if (tabId != recordingTabId || recordingState != 'active') {
      return;
    }

    const tab = await getTab(tabId);

    const navigationEvent = {
      type: 'navigate',
      url: tab.url,
      source: 'user',
    };

    const newRecording = [
      ...recording,
      {
        ...navigationEvent,
      },
    ];

    chrome.storage.local.set({ recording: newRecording });
    injectContentScript(tabId);
  }
});

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
  if (changes.recordingState.newValue == 'active') {
    chrome.contextMenus.update(CTX_MENU_ID, {
      enabled: true,
    });
  }
  if (changes.recordingState.newValue == 'finished') {
    chrome.contextMenus.update(CTX_MENU_ID, {
      enabled: false,
    });
  }
});
