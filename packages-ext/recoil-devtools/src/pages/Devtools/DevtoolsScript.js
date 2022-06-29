/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 * @oncall recoil
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
