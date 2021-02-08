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
        return {type: 'result', result};
      } else {
        /**
         * Note the existing cache may have a non-equal result at the end of
         * the route for identical paths in some edge cases. For example take
         * this example when using value-equality caching:
         *
         * - AtomC: 2
         * - SelectorB: (AtomC) => {val: AtomC % 2} [pretend this is async]
         * - SelectorA: (AtomB) => AtomB
         *
         * For the first run, Selector A evaluates to {val: 0}
         *
         * Now if AtomC changes to 4, SelectorB is placed in an async state,
         * which triggers a re-evaluation of Selector A. It turns out SelectorB
         * will evaluate once again to {val: 0}, which means selector A will
         * compute a cache path key ["A": "{val: 0}"], which is a cache key
         * that was previously computed (when using a value-equality cache) in
         * the first run, but the new value is a new object so it will not have
         * reference equality with the object produced in the first run. For
         * that reason, we should not have an invariant() check for checking
         * that equal paths have equal values in the cache.
         */
        return root;
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

  const nodeValue = getNodeValue(root.nodeKey);

  if (root.branches.has(nodeValue)) {
    handlers?.onCacheHit?.(root.nodeKey);
  }

  return getFromTreeCache(root.branches.get(nodeValue), getNodeValue, handlers);
}

module.exports = {setInTreeCache, getFromTreeCache};
