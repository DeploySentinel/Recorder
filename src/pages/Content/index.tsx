import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import ControlBar from './ControlBar';

import FaStyle from '@fortawesome/fontawesome-svg-core/styles.css';
import CommonStyle from '../Common/styles.css';

const target = document.body.appendChild(document.createElement('DIV'));

declare global {
  interface Window {
    __DEPLOYSENTINEL_CLEAN_UP: () => void;
    __DEPLOYSENTINEL_SCRIPT: boolean | null;
  }
}

// Expose a clean up function after a test completes
function cleanUp() {
  window.__DEPLOYSENTINEL_SCRIPT = null;
  // @ts-ignore - the typing doesn't like shadow roots for some reason
  unmountComponentAtNode(target.shadowRoot);
}
window.__DEPLOYSENTINEL_CLEAN_UP = cleanUp;

if (window.__DEPLOYSENTINEL_SCRIPT == null) {
  // Mark that we've loaded into this tab so injecting the script again doesn't trigger everything
  window.__DEPLOYSENTINEL_SCRIPT = true;

  target.attachShadow({ mode: 'open' });
  render(
    <>
      <style>
        {CommonStyle}
        {FaStyle}
      </style>
      <ControlBar onExit={cleanUp} />
    </>,
    target.shadowRoot
  );
}
