/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Utilities for working with built-in Maps and Sets without mutating them.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */

'use strict';

function setByAddingToSet<V>(set: $ReadOnlySet<V>, v: V): Set<V> {
  const next = new Set(set);
  next.add(v);
  return next;
}

function setByDeletingFromSet<V>(set: $ReadOnlySet<V>, v: V): Set<V> {
  const next = new Set(set);
  next.delete(v);
  return next;
}

function mapBySettingInMap<K, V>(map: Map<K, V>, k: K, v: V): Map<K, V> {
  map.set(k, v);
  return map;
}

function mapByUpdatingInMap<K, V>(
  map: Map<K, V>,
  k: K,
  updater: (V | void) => V,
): Map<K, V> {
  map.set(k, updater(map.get(k)));
  return map;
}

function mapByDeletingFromMap<K, V>(map: $ReadOnlyMap<K, V>, k: K): Map<K, V> {
  const next = new Map(map);
  next.delete(k);
  return next;
}

module.exports = {
  setByAddingToSet,
  setByDeletingFromSet,
  mapBySettingInMap,
  mapByUpdatingInMap,
  mapByDeletingFromMap,
};
