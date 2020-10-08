/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

import type {NodeCache} from './Recoil_NodeCache';

import stableStringify from '../util/Recoil_stableStringify';
import {getFromTreeCache, setInTreeCache} from './Recoil_TreeNodeCache';

export default function treeCacheValueEquality<T>(): NodeCache<T> {
  let treeRoot;
  return {
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
