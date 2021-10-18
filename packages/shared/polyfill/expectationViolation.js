/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const sprintf = require('./sprintf');

function expectationViolation(format: string, ...args: $ReadOnlyArray<mixed>) {
  if (__DEV__) {
    const message = sprintf.call(null, format, ...args);
    const error = new Error(message);
    error.name = 'Expectation Violation';
    console.error(error);
  }
}

module.exports = expectationViolation;
