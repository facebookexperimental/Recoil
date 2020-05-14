/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict
 * @format
 */

'use strict';

declare function isPromise(p: mixed): boolean %checks(p instanceof Promise);

// Split declaration and implementation to allow this function to pretend to
// check for actual instance of Promise instead of something with a `then`
// method.
// eslint-disable-next-line no-redeclare
function isPromise(p: $FlowFixMe): boolean {
  return !!p && typeof p.then === 'function';
}

module.exports = isPromise;
