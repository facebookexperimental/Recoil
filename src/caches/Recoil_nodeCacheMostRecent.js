/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

import type {NodeCache} from './Recoil_NodeCache';

function nodeCacheMostRecent<T>(): NodeCache<T> {
  let mostRecent;
  return {
    type: 'mostRecent',
    get: (getNodeValue, handlers) => {
      if (mostRecent === undefined) {
        return undefined;
      }

      for (const [nodeKey, nodeValue] of mostRecent.route) {
        if (getNodeValue(nodeKey) !== nodeValue) {
          return undefined;
        }

        handlers?.onCacheHit?.(nodeKey);
      }

      return mostRecent.value;
    },
    set: (route, value) => {
      mostRecent = {route, value};
    },
    getRoot: () => mostRecent,
  };
}

module.exports = nodeCacheMostRecent;
