/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

import type {NodeCache} from './Recoil_NodeCache';

import {getFromTreeCache, setInTreeCache} from './Recoil_TreeNodeCache';

export default function treeCacheReferenceEquality<T>(): NodeCache<T> {
  let treeRoot;
  return {
    get: (getNodeValue, handlers) =>
      getFromTreeCache(treeRoot, getNodeValue, handlers),
    set: (route, result) => {
      treeRoot = setInTreeCache(treeRoot, route, result);
    },
    getRoot: () => treeRoot,
  };
}
