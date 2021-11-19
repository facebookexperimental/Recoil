/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
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
): $ReadOnlySet<TValue> {
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
