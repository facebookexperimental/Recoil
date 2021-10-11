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
