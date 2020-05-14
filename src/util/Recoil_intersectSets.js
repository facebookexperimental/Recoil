/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Returns the set of values that are present in all the given sets, preserving
 * the order of the first set.
 *
 * Note: this is written procedurally (i.e., without filterSet) for performant
 * use in tight loops.
 *
 * @flow strict
 * @format
 */

'use strict';

function intersectSets<T>(
  first: $ReadOnlySet<T>,
  ...rest: Array<$ReadOnlySet<T>>
): Set<T> {
  const ret = new Set();
  FIRST: for (const value of first) {
    for (const otherSet of rest) {
      if (!otherSet.has(value)) {
        continue FIRST;
      }
    }
    ret.add(value);
  }
  return ret;
}

module.exports = intersectSets;
