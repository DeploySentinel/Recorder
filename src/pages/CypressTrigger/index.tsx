import React, { useEffect } from 'react';
import { render } from 'react-dom';

import Icon from '../Common/Icon';
import { usePreferredLibrary, useRecordingState } from '../Common/hooks';
import { endRecording } from '../Common/endRecording';
import { ScriptType } from '../types';

import FaStyle from '@fortawesome/fontawesome-svg-core/styles.css';
import CommonStyle from '../Common/styles.css';

function TriggerButton() {
  // Always set library to Cypress
  const [_, setPreferredLibrary] = usePreferredLibrary();
  useEffect(() => {
    setPreferredLibrary(ScriptType.Cypress);
  }, []);

  const [recordingTabId] = useRecordingState();

  const isRecording = recordingTabId != null;

  return (
    <div
      className="d-flex items-center px-3 cypress-trigger"
      title="Start a New Test Recording"
      style={{ cursor: 'pointer', height: '100%', marginLeft: 8 }}
      onClick={async () => {
        if (isRecording) {
          endRecording();
        } else {
          chrome.runtime.sendMessage({
            type: 'cypress-trigger-start-recording',
          });
        }
      }}
    >
      <Icon />
      {isRecording ? (
        <span className="text-red" style={{ marginLeft: 6 }}>
          End Recording
        </span>
      ) : (
        <span style={{ marginLeft: 6 }}>Record</span>
      )}
    </div>
  );
}

// retry selector until it's available
const retrySelector = (selector: string, maxRetries: number) => {
  let retries = 0;
  return new Promise<Element | null>((resolve, reject) => {
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el != null) {
        clearInterval(interval);
        return resolve(el);
      } else if (retries >= maxRetries) {
        clearInterval(interval);
        return reject(
          new Error(`Could not find element with selector ${selector}`)
        );
      }
      retries++;
    }, 250);
  });
};

(async () => {
  // Fetch nodes we need to mount to with retry
  const urlBar = await retrySelector(
    '#spec-runner-header > div.flex:first-child',
    20
  );
  const selectorPlaygroundButton = await retrySelector(
    '#spec-runner-header [data-cy="aut-url"]',
    20
  );
  if (selectorPlaygroundButton == null || urlBar == null) {
    throw new Error('Could not find insertion element');
  }

  // Prevent the button from being mounted multiple times (bug in FF)
  if (
    document.getElementById('deploysentinel-cypress-trigger-button') != null
  ) {
    return;
  }
  const newElem = document.createElement('div');
  newElem.id = 'deploysentinel-cypress-trigger-button';
  const target = urlBar.insertBefore(newElem, selectorPlaygroundButton);
  target.attachShadow({ mode: 'open' });
  render(
    <>
      <style>
        {CommonStyle}
        {FaStyle}
      </style>
      <TriggerButton />
    </>,
    target.shadowRoot
  );
})();
