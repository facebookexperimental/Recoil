/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {BackgroundPage} from '../../types/DevtoolsTypes';

const PopupApp = require('./PopupApp');
const React = require('react');
const {render} = require('react-dom');
const {RecoilRoot} = require('recoil');

/* globals chrome */
// $FlowFixMe: chrome
chrome.runtime.getBackgroundPage(({store}: BackgroundPage) => {
  render(
    <RecoilRoot>
      <PopupApp store={store} />
    </RecoilRoot>,
    window.document.querySelector('#app-container'),
  );
});
