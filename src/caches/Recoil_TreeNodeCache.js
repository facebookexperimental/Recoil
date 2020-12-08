/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from '../adt/Recoil_Loadable';
import type {NodeKey} from '../core/Recoil_State';
import type {Handlers} from './Recoil_NodeCache';
import type {GetNodeValue, NodeCacheRoute} from './Recoil_NodeCache';

const invariant = require('../util/Recoil_invariant');

export type TreeCacheNode<T> = TreeCacheResult<T> | TreeCacheBranch<T>;

export type TreeCacheResult<T> = {type: 'result', result: Loadable<T>};

export type TreeCacheBranch<T> = {
  type: 'branch',
  nodeKey: NodeKey,
  branches: Map<mixed, TreeCacheNode<T>>,
};

function setInTreeCache<T>(
  root: ?TreeCacheNode<T>,
  route: NodeCacheRoute,
  result: Loadable<T>,
): TreeCacheNode<T> {
  if (root == null) {
    if (route.length === 0) {
      return {type: 'result', result};
    } else {
      const [path, ...rest] = route;
      const [nodeKey, value] = path;
      const ret = {
        type: 'branch',
        nodeKey,
        branches: new Map([[value, setInTreeCache(null, rest, result)]]),
      };

      return ret;
    }
  } else {
    if (route.length === 0) {
      invariant(
        root.type === 'result',
        'Existing cache must have a result type node at the end of the route',
      );
      if (root.result && root.result.state === 'loading') {
        const ret = {type: 'result', result};

        return ret;
      } else {
        invariant(
          root.result.contents === result.contents &&
            root.result.state === result.state,
          'Existing cache must have the same result at the end of the route',
        );
        const ret = root;

        return ret;
      }
    } else {
      const [path, ...rest] = route;
      const [nodeKey, value] = path;
      invariant(
        root.type === 'branch',
        'Existing cache must have a branch midway through the route',
      );
      invariant(
        root.nodeKey === nodeKey,
        'Existing cache must have a branch for the same nodeKey midway through the route',
      );
      root.branches.set(
        value,
        setInTreeCache(root.branches.get(value), rest, result),
      );

      return root;
    }
  }
}

function getFromTreeCache<T>(
  root: ?TreeCacheNode<T>,
  getNodeValue: GetNodeValue,
  handlers: Handlers,
): Loadable<T> | void {
  if (root == null) {
    return undefined;
  }

  if (root.type === 'result') {
    return root.result;
  }

  handlers?.onCacheHit?.(root.nodeKey);

  const nodeValue = getNodeValue(root.nodeKey);

  return getFromTreeCache(root.branches.get(nodeValue), getNodeValue, handlers);
}

module.exports = {setInTreeCache, getFromTreeCache};
