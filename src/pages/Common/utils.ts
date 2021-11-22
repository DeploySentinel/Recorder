export function setEndRecordingStorage() {
  chrome.storage.local.set({
    recordingState: 'finished',
    recordingTabId: null,
  });
}

export function localStorageGet(keys: string[]) {
  return new Promise<{ [key: string]: any }>((resolve, reject) => {
    chrome.storage.local.get(keys, (storage) => {
      resolve(storage);
    });
  });
}

export async function getCurrentTab(): Promise<chrome.tabs.Tab> {
  // This is because we're straddling v2 and v3 manifest
  const api = typeof browser === 'object' ? browser : chrome;

  const [tab] = await api.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tab;
}

export async function executeScript(tabId: number, file: string) {
  if (typeof browser === 'object') {
    await browser.tabs.executeScript(tabId, { file });
  } else {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [file],
    });
  }
}

export async function executeCleanUp(tabId: number) {
  if (typeof browser === 'object') {
    await browser.tabs.executeScript(tabId, {
      code: `
        if (typeof window?.__DEPLOYSENTINEL_CLEAN_UP === 'function') {
          window.__DEPLOYSENTINEL_CLEAN_UP();
        }
      `,
    });
  } else {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (typeof window?.__DEPLOYSENTINEL_CLEAN_UP === 'function') {
          window.__DEPLOYSENTINEL_CLEAN_UP();
        }
      },
    });
  }
}
