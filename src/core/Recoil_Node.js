/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from '../adt/Recoil_Loadable';
import type {DependencyMap} from './Recoil_GraphTypes';
import type {RecoilValue} from './Recoil_RecoilValue';
import type {AtomWrites, NodeKey, Store, TreeState} from './Recoil_State';

const expectationViolation = require('../util/Recoil_expectationViolation');
const mapIterable = require('../util/Recoil_mapIterable');
const nullthrows = require('../util/Recoil_nullthrows');
const recoverableViolation = require('../util/Recoil_recoverableViolation');
const RecoilValueClasses = require('./Recoil_RecoilValue');

class DefaultValue {}
const DEFAULT_VALUE: DefaultValue = new DefaultValue();

class RecoilValueNotReady extends Error {
  constructor(key: string) {
    super(
      `Tried to set the value of Recoil selector ${key} using an updater function, but it is an async selector in a pending or error state; this is not supported.`,
    );
  }
}

export type PersistenceType = 'none' | 'url';
export type PersistenceInfo = $ReadOnly<{
  type: PersistenceType,
  backButton?: boolean,
}>;

export type ReadOnlyNodeOptions<T> = $ReadOnly<{
  key: NodeKey,

  // Returns the current value without evaluating or modifying state
  peek: (Store, TreeState) => ?Loadable<T>,

  // Returns the discovered deps and the loadable value of the node
  get: (Store, TreeState) => [DependencyMap, Loadable<T>],

  // Clean up the node when it is removed from a <RecoilRoot>
  cleanUp: Store => void,

  // Informs the node to invalidate any caches as needed in case either it is
  // set or it has an upstream dependency that was set. (Called at batch end.)
  invalidate?: TreeState => void,

  shouldRestoreFromSnapshots: boolean,

  dangerouslyAllowMutability?: boolean,
  persistence_UNSTABLE?: PersistenceInfo,
}>;

export type ReadWriteNodeOptions<T> = $ReadOnly<{
  ...ReadOnlyNodeOptions<T>,

  // Returns the discovered deps and the set of key-value pairs to be written.
  // (Deps may be discovered since selectors get an updater function which has
  //  the ability to read other atoms, which may have deps.)
  set: (
    store: Store,
    state: TreeState,
    newValue: T | DefaultValue,
  ) => [DependencyMap, AtomWrites],
}>;

type Node<T> = ReadOnlyNodeOptions<T> | ReadWriteNodeOptions<T>;

// flowlint-next-line unclear-type:off
const nodes: Map<string, Node<any>> = new Map();
// flowlint-next-line unclear-type:off
const recoilValues: Map<string, RecoilValue<any>> = new Map();

/* eslint-disable no-redeclare */
declare function registerNode<T>(
  node: ReadWriteNodeOptions<T>,
): RecoilValueClasses.RecoilState<T>;

declare function registerNode<T>(
  node: ReadOnlyNodeOptions<T>,
): RecoilValueClasses.RecoilValueReadOnly<T>;

function recoilValuesForKeys(
  keys: Iterable<NodeKey>,
): Iterable<RecoilValue<mixed>> {
  return mapIterable(keys, key => nullthrows(recoilValues.get(key)));
}

function registerNode<T>(node: Node<T>): RecoilValue<T> {
  if (nodes.has(node.key)) {
    const message = `Duplicate atom key "${node.key}". This is a FATAL ERROR in
      production. But it is safe to ignore this warning if it occurred because of
      hot module replacement.`;
    // TODO Need to figure out if there is a standard/open-source equivalent to see if hot module replacement is happening:
    // prettier-ignore
    // @fb-only: if (__DEV__) {
    // @fb-only: const isAcceptingUpdate = require('__debug').isAcceptingUpdate;
    // prettier-ignore
    // @fb-only: if (typeof isAcceptingUpdate !== 'function' || !isAcceptingUpdate()) {
    // @fb-only: expectationViolation(message, 'recoil');
    // @fb-only: }
    // prettier-ignore
    // @fb-only: } else {
    // @fb-only: recoverableViolation(message, 'recoil');
    // @fb-only: }
    console.warn(message); // @oss-only
  }
  nodes.set(node.key, node);

  const recoilValue: RecoilValue<T> =
    node.set == null
      ? new RecoilValueClasses.RecoilValueReadOnly(node.key)
      : new RecoilValueClasses.RecoilState(node.key);

  recoilValues.set(node.key, recoilValue);
  return recoilValue;
}
/* eslint-enable no-redeclare */

class NodeMissingError extends Error {}

// flowlint-next-line unclear-type:off
function getNode(key: NodeKey): Node<any> {
  const node = nodes.get(key);
  if (node == null) {
    throw new NodeMissingError(`Missing definition for RecoilValue: "${key}""`);
  }
  return node;
}

// flowlint-next-line unclear-type:off
function getNodeMaybe(key: NodeKey): void | Node<any> {
  return nodes.get(key);
}

module.exports = {
  nodes,
  recoilValues,
  registerNode,
  getNode,
  getNodeMaybe,
  recoilValuesForKeys,
  NodeMissingError,
  DefaultValue,
  DEFAULT_VALUE,
  RecoilValueNotReady,
};
