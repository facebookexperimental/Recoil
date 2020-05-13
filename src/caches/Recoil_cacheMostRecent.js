/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict
 * @format
 */
'use strict';

import type {CacheImplementation} from 'Recoil_Cache';

// cache implementation that only stores the most recent entry
// based on key reference equality
function cacheMostRecent<T>(): CacheImplementation<T> {
  let mostRecentKey;
  let mostRecentValue;
  const cache = {
    get: key => (key === mostRecentKey ? mostRecentValue : undefined),
    set: (key, value) => {
      mostRecentKey = key;
      mostRecentValue = value;
      return cache;
    },
  };
  return cache;
}

module.exports = cacheMostRecent;
