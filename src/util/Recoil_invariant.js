/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

function invariant(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

module.exports = invariant;
