function originFromWebapp(origin: string) {
  const originURL = new URL(origin);
  return (
    originURL.hostname === 'localhost' ||
    originURL.hostname === 'deploysentinel.com' ||
    originURL.hostname.indexOf('.deploysentinel.com') > -1
  );
}

window.addEventListener('message', (event) => {
  const data = event?.data ?? {};
  if (
    data?.source === 'deploysentinel-test-editor' &&
    data?.type === 'start-recording' &&
    originFromWebapp(event.origin)
  ) {
    chrome.runtime.sendMessage({ url: data?.url, type: 'start-recording' });
  }

  if (
    data?.source === 'deploysentinel-test-editor' &&
    data?.type === 'ping' &&
    originFromWebapp(event.origin)
  ) {
    window.postMessage({
      source: 'deploysentinel-recorder',
      type: 'pong',
    });
  }
});

chrome.runtime.onMessage.addListener(async function (request) {
  if (request?.type === 'playwright-test-recording') {
    window.postMessage({
      source: 'deploysentinel-recorder',
      type: 'playwright-test-recording',
      code: request?.code,
      actions: request?.actions,
    });
  }
});
