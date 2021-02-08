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
import type {CacheImplementationType} from './Recoil_Cache';
import type {TreeCacheNode} from './Recoil_TreeNodeCache';

export type NodeCacheRoute = Array<[NodeKey, mixed]>;

export type GetNodeValue = (nodeKey: NodeKey) => mixed;

export type Handlers = ?{
  onCacheHit?: NodeKey => void,
};

export type NodeCache<+T> = $ReadOnly<{
  type: CacheImplementationType,
  get: (GetNodeValue, Handlers) => Loadable<T> | void,
  set: (NodeCacheRoute, Loadable<T>) => void,
  getRoot: () => {route: NodeCacheRoute, value: Loadable<T>} | TreeCacheNode<T>,
}>;
