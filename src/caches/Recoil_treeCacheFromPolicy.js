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

import type {
  CachePolicy,
  EqualityPolicy,
  EvictionPolicy,
} from './Recoil_CachePolicy';
import type {TreeCacheImplementation} from './Recoil_TreeCacheImplementationType';

const err = require('../util/Recoil_err');
const nullthrows = require('../util/Recoil_nullthrows');
const stableStringify = require('../util/Recoil_stableStringify');
const {TreeCache} = require('./Recoil_TreeCache');
const treeCacheLRU = require('./Recoil_treeCacheLRU');

const defaultPolicy = {
  equality: 'reference',
  eviction: 'keep-all',
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

  throw err(`Unrecognized equality policy ${equality}`);
}

function getTreeCache<T>(
  eviction: EvictionPolicy,
  maxSize: ?number,
  mapNodeValue: mixed => mixed,
): TreeCacheImplementation<T> {
  switch (eviction) {
    case 'keep-all':
      // $FlowFixMe[method-unbinding]
      return new TreeCache<T>({mapNodeValue});
    case 'lru':
      return treeCacheLRU<T>(nullthrows(maxSize), mapNodeValue);
    case 'most-recent':
      return treeCacheLRU<T>(1, mapNodeValue);
  }

  throw err(`Unrecognized eviction policy ${eviction}`);
}

module.exports = treeCacheFromPolicy;
