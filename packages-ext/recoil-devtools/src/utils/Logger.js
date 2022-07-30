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

function debug(...args: $ReadOnlyArray<mixed>) {
  if (__DEV__) {
    /* eslint-disable-next-line fb-www/no-console */
    console.log(...args);
  }
}

function warn(...args: $ReadOnlyArray<mixed>) {
  if (typeof console !== 'undefined') {
    console.warn(...args);
  }
}

module.exports = {debug, warn};
