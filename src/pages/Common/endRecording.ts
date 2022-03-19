import { setEndRecordingStorage, localStorageGet } from './utils';
import { genCode } from '../builders';

export async function endRecording() {
  const { recording, returnTabId } = await localStorageGet([
    'recording',
    'returnTabId',
  ]);
  setEndRecordingStorage();

  // We need to send the generated recording back to the webapp
  if (returnTabId != null) {
    const code = genCode(recording);

    chrome.runtime.sendMessage({
      type: 'forward-recording',
      tabId: returnTabId,
      code,
      actions: recording,
    });
  }
}
