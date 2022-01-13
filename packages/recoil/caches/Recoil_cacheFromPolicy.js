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

import type {CacheImplementation} from './Recoil_CacheImplementationType';
import type {
  CachePolicy,
  EqualityPolicy,
  EvictionPolicy,
} from './Recoil_CachePolicy';

import {LRUCache} from './Recoil_LRUCache';
import {MapCache} from './Recoil_MapCache';
import err from 'recoil-shared/util/Recoil_err';
import nullthrows from 'recoil-shared/util/Recoil_nullthrows';
import stableStringify from 'recoil-shared/util/Recoil_stableStringify';

const defaultPolicy = {
  equality: 'reference',
  eviction: 'none',
  maxSize: Infinity,
};

function getValueMapper(equality: EqualityPolicy): mixed => mixed {
  switch (equality) {
    case 'reference':
      return val => val;
    case 'value':
      return val => stableStringify(val);
  }

  throw err(`Unrecognized equality policy ${equality}`);
}

function getCache<K, V>(
  eviction: EvictionPolicy,
  maxSize: ?number,
  mapKey: mixed => mixed,
): CacheImplementation<K, V> {
  switch (eviction) {
    case 'keep-all':
      // $FlowFixMe[method-unbinding]
      return new MapCache<K, V>({mapKey});
    case 'lru':
      // $FlowFixMe[method-unbinding]
      return new LRUCache<K, V>({mapKey, maxSize: nullthrows(maxSize)});
    case 'most-recent':
      // $FlowFixMe[method-unbinding]
      return new LRUCache<K, V>({mapKey, maxSize: 1});
  }

  throw err(`Unrecognized eviction policy ${eviction}`);
}

export default function cacheFromPolicy<K, V>({
  equality = defaultPolicy.equality,
  eviction = defaultPolicy.eviction,
  maxSize = defaultPolicy.maxSize,
}: CachePolicy = defaultPolicy): CacheImplementation<K, V> {
  const valueMapper = getValueMapper(equality);
  const cache = getCache<K, V>(eviction, maxSize, valueMapper);

  return cache;
}
