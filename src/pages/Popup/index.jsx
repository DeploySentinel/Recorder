import React from 'react';
import { render } from 'react-dom';

import Popup from './Popup';
import IndexStyle from './index.css';
import CommonStyle from '../Common/styles.css';
import FaStyle from '@fortawesome/fontawesome-svg-core/styles.css';

render(
  <>
    <style>
      {FaStyle}
      {CommonStyle}
      {IndexStyle}
    </style>
    <Popup />
  </>,
  window.document.querySelector('#app-container')
);

if (module.hot) module.hot.accept();
