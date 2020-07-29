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
 * Returns a set containing all of the values from the original set where
 * the given callback returned true.
 */
function filterSet<TValue>(
  set: $ReadOnlySet<TValue>,
  callback: (value: TValue) => boolean,
): Set<TValue> {
  const result = new Set();
  for (const value of set) {
    if (callback(value)) {
      result.add(value);
    }
  }

  return result;
}

module.exports = filterSet;
