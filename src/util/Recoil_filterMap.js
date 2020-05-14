/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * Returns a map containing all of the keys + values from the original map where
 * the given callback returned true.
 */
function filterMap<TKey, TValue>(
  map: $ReadOnlyMap<TKey, TValue>,
  callback: (value: TValue, key: TKey) => boolean,
): Map<TKey, TValue> {
  const result = new Map();
  for (const [key, value] of map) {
    if (callback(value, key)) {
      result.set(key, value);
    }
  }

  return result;
}

module.exports = filterMap;
