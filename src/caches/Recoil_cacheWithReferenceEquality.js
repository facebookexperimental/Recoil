/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Cache implementation with reference equality for keys
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {
  CacheImplementation,
  CacheImplementationType,
} from './Recoil_Cache';

const {ArrayKeyedMap} = require('../adt/Recoil_ArrayKeyedMap');

class ArrayKeyedMapWithCacheImplementationType<T> extends ArrayKeyedMap<T> {
  type: CacheImplementationType;

  constructor(type: CacheImplementationType) {
    super();
    this.type = type;
  }
}

function cacheWithReferenceEquality<T>(): CacheImplementation<T> {
  return new ArrayKeyedMapWithCacheImplementationType('reference');
}

module.exports = cacheWithReferenceEquality;
