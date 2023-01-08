/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

function unionSets<TValue>(
  ...sets: $ReadOnlyArray<$ReadOnlySet<TValue>>
): Set<TValue> {
  const result = new Set<TValue>();
  for (const set of sets) {
    for (const value of set) {
      result.add(value);
    }
  }
  return result;
}

module.exports = unionSets;
