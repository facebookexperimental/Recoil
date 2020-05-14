/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * Returns a set containing all of the values from the first set that are not
 * present in any of the subsequent sets.
 *
 * Note: this is written procedurally (i.e., without filterSet) for performant
 * use in tight loops.
 */
function differenceSets<TValue>(
  set: $ReadOnlySet<TValue>,
  ...setsWithValuesToRemove: $ReadOnlyArray<$ReadOnlySet<TValue>>
): Set<TValue> {
  const ret = new Set();
  FIRST: for (const value of set) {
    for (const otherSet of setsWithValuesToRemove) {
      if (otherSet.has(value)) {
        continue FIRST;
      }
    }
    ret.add(value);
  }
  return ret;
}

module.exports = differenceSets;
