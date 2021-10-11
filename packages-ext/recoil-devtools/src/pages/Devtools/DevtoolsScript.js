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

/* globals chrome */
// $FlowFixMe: get chrome types
chrome.devtools.panels.create(
  __DEV__ ? 'Recoil (DEV)' : 'Recoil',
  '',
  'devpanel.html',
  () => {},
);
