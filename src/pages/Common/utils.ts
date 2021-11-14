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
