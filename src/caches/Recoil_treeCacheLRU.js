/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

import type {TreeCacheImplementation} from './Recoil_TreeCacheImplementationType';

const {LRUCache} = require('./Recoil_LRUCache');
const {TreeCache} = require('./Recoil_TreeCache');

function treeCacheLRU<T>(
  maxSize: number,
  mapNodeValue?: mixed => mixed = v => v,
): TreeCacheImplementation<T> {
  const lruCache = new LRUCache({maxSize});

  const cache = new TreeCache({
    mapNodeValue,
    onHit: node => {
      lruCache.set(node, true);
    },
    onSet: node => {
      const lruNode = lruCache.tail();

      lruCache.set(node, true);

      if (lruNode && cache.size() > maxSize) {
        cache.delete(lruNode.key);
      }
    },
  });

  return cache;
}

module.exports = treeCacheLRU;
