/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

const sprintf = require('./Recoil_sprintf');
function expectationViolation(format: string, ...args: $ReadOnlyArray<mixed>) {
  if (__DEV__) {
    const message = sprintf.call(null, format, ...args);
    const error = new Error(message);
    error.name = 'Expectation Violation';
    console.error(error);
  }
}

module.exports = expectationViolation;
