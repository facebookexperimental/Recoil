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

import type {CacheImplementation} from './Recoil_Cache';

const {ArrayKeyedMap} = require('../adt/Recoil_ArrayKeyedMap');

function cacheWithReferenceEquality<T>(): CacheImplementation<T> {
  return new ArrayKeyedMap();
}

module.exports = cacheWithReferenceEquality;
