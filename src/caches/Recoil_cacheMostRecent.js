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

import type {CacheImplementation} from './Recoil_Cache';

// cache implementation that only stores the most recent entry
// based on key reference equality
function cacheMostRecent<T>(): CacheImplementation<T> {
  let mostRecentKey;
  let mostRecentValue;

  const cache = {
    type: 'mostRecent',
    get: key => (key === mostRecentKey ? mostRecentValue : undefined),
    set: (key, value) => {
      mostRecentKey = key;
      mostRecentValue = value;
      return cache;
    },
    delete: key => {
      if (key === mostRecentKey) {
        mostRecentKey = mostRecentValue = undefined;
      }
      return cache;
    },
  };
  return cache;
}

module.exports = cacheMostRecent;
