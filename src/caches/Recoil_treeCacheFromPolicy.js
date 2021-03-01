/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  CachePolicy,
  EqualityPolicy,
  EvictionPolicy,
} from './Recoil_CachePolicy';
import type {TreeCacheImplementation} from './Recoil_TreeCacheImplementationType';

const nullthrows = require('../util/Recoil_nullthrows');
const stableStringify = require('../util/Recoil_stableStringify');
const TreeCache = require('./Recoil_TreeCache');
const treeCacheLRU = require('./Recoil_treeCacheLRU');

const defaultPolicy = {
  equality: 'reference',
  eviction: 'none',
  maxSize: Infinity,
};

function treeCacheFromPolicy<T>({
  equality = defaultPolicy.equality,
  eviction = defaultPolicy.eviction,
  maxSize = defaultPolicy.maxSize,
}: CachePolicy = defaultPolicy): TreeCacheImplementation<T> {
  const valueMapper = getValueMapper(equality);
  const treeCache = getTreeCache(eviction, maxSize, valueMapper);

  return treeCache;
}

function getValueMapper(equality: EqualityPolicy): mixed => mixed {
  switch (equality) {
    case 'reference':
      return val => val;
    case 'value':
      return val => stableStringify(val);
  }

  throw new Error(`Unrecognized equality policy ${equality}`);
}

function getTreeCache<T>(
  eviction: EvictionPolicy,
  maxSize: ?number,
  mapNodeValue: mixed => mixed,
): TreeCacheImplementation<T> {
  switch (eviction) {
    case 'none':
      return new TreeCache<T>({mapNodeValue});
    case 'lru':
      return treeCacheLRU<T>(nullthrows(maxSize), mapNodeValue);
  }

  throw new Error(`Unrecognized eviction policy ${eviction}`);
}

module.exports = treeCacheFromPolicy;
