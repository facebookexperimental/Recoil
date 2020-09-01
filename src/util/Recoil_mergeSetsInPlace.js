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

function mergeSetsInPlace<TKey>(
  destSet: Set<TKey>,
  ...srcSets: $ReadOnlyArray<$ReadOnlySet<TKey>>
): Set<TKey> {
  for (const srcSet of srcSets) {
    for (const key of srcSet) {
      destSet.add(key);
    }
  }
  return destSet;
}

module.exports = mergeSetsInPlace;
