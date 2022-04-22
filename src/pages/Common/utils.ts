export function setEndRecordingStorage() {
  chrome.storage.local.set({
    recordingState: 'finished',
    recordingTabId: null,
    recordingFrameId: null,
    returnTabId: null,
  });
}

export function setPreferredLibraryStorage(library: string) {
  chrome.storage.local.set({ preferredLibrary: library });
}

export function setPreferredBarPositionStorage(position: string) {
  chrome.storage.local.set({ preferredBarPosition: position });
}

export function setStartRecordingStorage(
  tabId: number,
  frameId: number,
  newUrl: string,
  returnTabId?: number
) {
  const storage = {
    recordingState: 'active',
    recordingTabId: tabId,
    recordingFrameId: frameId,
    recording: [
      {
        type: 'load',
        url: newUrl,
      },
    ],
    ...(returnTabId != null
      ? {
          returnTabId,
        }
      : {}),
  };
  chrome.storage.local.set(storage);
}

export async function createTab(url: string) {
  // This is because we're straddling v2 and v3 manifest
  const api = typeof browser === 'object' ? browser : chrome;

  const tab = await api.tabs.create({
    url,
  });

  return tab;
}

export function localStorageGet(keys: string[]) {
  return new Promise<{ [key: string]: any }>((resolve, reject) => {
    chrome.storage.local.get(keys, (storage) => {
      resolve(storage);
    });
  });
}

export async function getRandomInstallId() {
  return localStorageGet(['randomId']).then(({ randomId }) => {
    let id = randomId;
    if (randomId == null) {
      id = `${Math.floor(Math.random() * 1000000)}`;
      chrome.storage.local.set({ randomId: id });
    }

    return id;
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

// Determins if the current tab is a Cypress test tab
export function isCypressBrowser(tabId: number) {
  if (typeof browser === 'object') {
    return browser.tabs
      .executeScript(tabId, {
        code: `document.querySelector('script[src*="/__cypress"]') != null`,
      })
      .then((result) => (result?.[0] ?? false) as boolean);
  } else {
    return new Promise((resolve, reject) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: () =>
            document.querySelector('script[src*="/__cypress"]') != null,
        },
        (executedScript) => resolve(executedScript?.[0]?.result ?? false)
      );
    });
  }
}

export function getCypressAutFrame(tabId: number) {
  return new Promise<chrome.webNavigation.GetAllFrameResultDetails>(
    (resolve, reject) => {
      chrome.webNavigation.getAllFrames({ tabId }, (frames) => {
        const autFrame = frames?.filter((frame) => {
          // Must be child of parent frame and not have "__cypress" in the url
          return (
            frame.parentFrameId === 0 && frame.url.indexOf('__cypress') === -1
          );
        })?.[0];
        if (autFrame == null || autFrame.frameId == null) {
          return reject(new Error('No AUT frame found'));
        }
        resolve(autFrame);
      });
    }
  );
}

export async function executeScript(
  tabId: number,
  frameId: number,
  file: string
) {
  if (typeof browser === 'object') {
    await browser.tabs.executeScript(tabId, { file, frameId });
  } else {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      files: [file],
    });
  }
}

export async function executeCleanUp(tabId: number, frameId: number) {
  if (typeof browser === 'object') {
    await browser.tabs.executeScript(tabId, {
      frameId,
      code: `
        if (typeof window?.__DEPLOYSENTINEL_CLEAN_UP === 'function') {
          window.__DEPLOYSENTINEL_CLEAN_UP();
        }
      `,
    });
  } else {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      func: () => {
        if (typeof window?.__DEPLOYSENTINEL_CLEAN_UP === 'function') {
          window.__DEPLOYSENTINEL_CLEAN_UP();
        }
      },
    });
  }
}
