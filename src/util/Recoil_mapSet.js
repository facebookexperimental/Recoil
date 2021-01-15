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
 * Returns a set containing the unique values resulting from applying the
 * given callback to each of the values from the original set.
 *
 * Note that this violates the "one-to-one mapping" component of the conceptual
 * "map" operation, in that the cardinality of the returned set may be less than
 * the cardinality of the starting set.
 */
function mapSet<TValue, TValueOut>(
  set: $ReadOnlySet<TValue>,
  callback: (value: TValue) => TValueOut,
): Set<TValueOut> {
  const result = new Set();
  for (const value of set) {
    result.add(callback(value));
  }
  return result;
}

module.exports = mapSet;
