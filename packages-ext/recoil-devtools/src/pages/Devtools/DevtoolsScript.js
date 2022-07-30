/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */
'use strict';

chrome.devtools.panels.create(
  __DEV__ ? 'Recoil (DEV)' : 'Recoil',
  '',
  'devpanel.html',
  () => {},
);
