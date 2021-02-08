/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

import type {NodeCache} from './Recoil_NodeCache';

const stableStringify = require('../util/Recoil_stableStringify');
const {getFromTreeCache, setInTreeCache} = require('./Recoil_TreeNodeCache');

function treeCacheValueEquality<T>(): NodeCache<T> {
  let treeRoot;
  return {
    type: 'value',
    get: (getNodeValue, handlers) =>
      getFromTreeCache(
        treeRoot,
        nodeKey => stableStringify(getNodeValue(nodeKey)),
        handlers,
      ),
    set: (route, result) => {
      treeRoot = setInTreeCache(
        treeRoot,
        route.map(([nodeKey, nodeValue]) => [
          nodeKey,
          stableStringify(nodeValue),
        ]),
        result,
      );
    },
    getRoot: () => treeRoot,
  };
}

module.exports = treeCacheValueEquality;
