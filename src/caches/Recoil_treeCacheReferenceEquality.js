/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

import type {NodeCache} from './Recoil_NodeCache';

const {getFromTreeCache, setInTreeCache} = require('./Recoil_TreeNodeCache');

function treeCacheReferenceEquality<T>(): NodeCache<T> {
  let treeRoot;
  return {
    type: 'reference',
    get: (getNodeValue, handlers) =>
      getFromTreeCache(treeRoot, getNodeValue, handlers),
    set: (route, result) => {
      treeRoot = setInTreeCache(treeRoot, route, result);
    },
    getRoot: () => treeRoot,
  };
}

module.exports = treeCacheReferenceEquality;
