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

  // $FlowFixMe[method-unbinding]
  return cache;
}

module.exports = treeCacheLRU;
