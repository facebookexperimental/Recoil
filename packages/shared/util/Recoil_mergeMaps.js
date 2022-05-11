/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

function mergeMaps<TKey, TValue>(
  ...maps: $ReadOnlyArray<$ReadOnlyMap<TKey, TValue>>
): Map<TKey, TValue> {
  const result = new Map<TKey, TValue>();
  for (let i = 0; i < maps.length; i++) {
    const iterator = maps[i].keys();
    let nextKey;
    while (!(nextKey = iterator.next()).done) {
      // $FlowIssue[incompatible-call] - map/iterator knows nothing about flow types
      result.set(nextKey.value, maps[i].get(nextKey.value));
    }
  }
  return result;
}

module.exports = mergeMaps;
