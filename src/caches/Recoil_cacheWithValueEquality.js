/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Cache implementation with value equality for keys
 *
 * @emails oncall+perf_viz
 * @flow strict
 * @format
 */
'use strict';

import type {CacheImplementation} from './Recoil_Cache';

const stableStringify = require('../util/Recoil_stableStringify');

// If we do profile and find the key equality check is expensive,
// we could always try to optimize..  Something that comes to mind is having
// each check assign an incrementing index to each reference that maps to the
// value equivalency.  Then, if an object already has an index, the comparison
// check/lookup would be trivial and the string serialization would only need
// to be done once per object instance.  Just a thought..

// Cache implementation to use value equality for keys instead of the default
// reference equality.  This allows different instances of dependency values to
// be used.  Normally this is not needed, as dependent atoms/selectors will
// themselves be cached and always return the same instance.  However, if
// different params or upstream values for those dependencies could produce
// equivalent values or they have a custom cache implementation, then this
// implementation may be needed.  The downside with this approach is that it
// takes longer to compute the value equivalence vs simple reference equality.
function cacheWithValueEquality<T>(): CacheImplementation<T> {
  const map: Map<mixed, T> = new Map();
  const cache = {
    get: key => map.get(stableStringify(key)),
    set: (key, value: T) => {
      map.set(stableStringify(key), value);
      return cache;
    },
    map, // For debugging
  };
  return cache;
}

module.exports = cacheWithValueEquality;
