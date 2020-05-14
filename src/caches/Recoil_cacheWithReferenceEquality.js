/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Cache implementation with reference equality for keys
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {CacheImplementation} from './Recoil_Cache';

const ArrayKeyedMap = require('../adt/Recoil_ArrayKeyedMap');

function cacheWithReferenceEquality<T>(): CacheImplementation<T> {
  return new ArrayKeyedMap();
}

module.exports = cacheWithReferenceEquality;
