/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict
 * @format
 */

'use strict';

function nullthrows<T>(x: ?T, message: ?string): T {
  if (x != null) {
    return x;
  }
  throw new Error(message ?? 'Got unexpected null or undefined');
}

module.exports = nullthrows;
