import { getRandomInstallId } from '../Common/utils';

const ANALYTICS_PATH = 'https://www.google-analytics.com/collect';
async function postData(url: string, data: URLSearchParams) {
  return fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: data,
  });
}

export async function onPageView(pageName: string) {
  try {
    var gaParams = new URLSearchParams();
    gaParams.append('v', '1');
    gaParams.append('tid', 'UA-212611604-2');
    gaParams.append('cid', await getRandomInstallId());
    gaParams.append('t', 'pageview');
    gaParams.append('dp', pageName);

    await postData(ANALYTICS_PATH, gaParams);
  } catch (e) {}
}

export async function onNewRecording(label: string) {
  try {
    var gaParams = new URLSearchParams();
    gaParams.append('v', '1');
    gaParams.append('tid', 'UA-212611604-2');
    gaParams.append('cid', await getRandomInstallId());
    gaParams.append('t', 'event');
    gaParams.append('ec', 'Recording');
    gaParams.append('ea', 'start');
    gaParams.append('el', label);

    await postData(ANALYTICS_PATH, gaParams);
  } catch (e) {}
}
