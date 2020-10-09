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
 * Returns a new Map object with the same keys as the original, but with the
 * values replaced with the output of the given callback function.
 */
function mapMap<TKey, TValue, TValueOut>(
  map: $ReadOnlyMap<TKey, TValue>,
  callback: (value: TValue, key: TKey) => TValueOut,
): Map<TKey, TValueOut> {
  const result = new Map();
  map.forEach((value, key) => {
    result.set(key, callback(value, key));
  });

  return result;
}

module.exports = mapMap;
