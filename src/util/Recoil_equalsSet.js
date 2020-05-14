/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

const everySet = require('./Recoil_everySet');

/**
 * Checks if two sets are equal
 */
function equalsSet<T>(one: $ReadOnlySet<T>, two: $ReadOnlySet<T>): boolean {
  if (one.size !== two.size) {
    return false;
  }
  return everySet(one, value => two.has(value));
}

module.exports = equalsSet;
