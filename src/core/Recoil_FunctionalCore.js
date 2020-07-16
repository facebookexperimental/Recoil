/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Logic for reading, writing, and subscribing to atoms within the context of
 * a particular React render tree. EVERYTHING IN THIS MODULE SHOULD BE PURE
 * FUNCTIONS BETWEEN IMMUTABLE TreeState VALUES. It is permissible to call
 * `getAtomDef` because atom definitions are constant.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from '../adt/Recoil_Loadable';
import type {DependencyMap, Graph} from './Recoil_Graph';
import type {DefaultValue} from './Recoil_Node';
import type {AtomValues, NodeKey, Store, TreeState} from './Recoil_State';

const {
  mapByDeletingFromMap,
  mapBySettingInMap,
  setByAddingToSet,
} = require('../util/Recoil_CopyOnWrite');
const nullthrows = require('../util/Recoil_nullthrows');
const Tracing = require('../util/Recoil_Tracing');
const {getNode, getNodeMaybe} = require('./Recoil_Node');

// flowlint-next-line unclear-type:off
const emptySet: $ReadOnlySet<any> = Object.freeze(new Set());

class ReadOnlyRecoilValueError extends Error {}

// Get the current value loadable of a node and update the state.
// Update dependencies and subscriptions for selectors.
// Update saved value validation for atoms.
function getNodeLoadable<T>(
  store: Store,
  state: TreeState,
  key: NodeKey,
): [DependencyMap, Loadable<T>] {
  return getNode(key).get(store, state);
}

// Peek at the current value loadable for a node.
// NOTE: Only use in contexts where you don't need to update the store with
//       new dependencies for the node!
function peekNodeLoadable<T>(
  store: Store,
  state: TreeState,
  key: NodeKey,
): Loadable<T> {
  return getNodeLoadable(store, state, key)[1];
}

// Write value directly to state bypassing the Node interface as the node
// definitions may not have been loaded yet when processing the initial snapshot.
function setUnvalidatedAtomValue<T>(
  state: TreeState,
  key: NodeKey,
  newValue: T,
): TreeState {
  const node = getNodeMaybe(key);
  node?.invalidate?.();

  return {
    ...state,
    atomValues: mapByDeletingFromMap(state.atomValues, key),
    nonvalidatedAtoms: mapBySettingInMap(
      state.nonvalidatedAtoms,
      key,
      newValue,
    ),
    dirtyAtoms: setByAddingToSet(state.dirtyAtoms, key),
  };
}

// Return the discovered dependencies and values to be written by setting
// a node value. (Multiple values may be written due to selectors getting to
// set upstreams; deps may be discovered because of reads in updater functions.)
function setNodeValue<T>(
  store: Store,
  state: TreeState,
  key: NodeKey,
  newValue: T | DefaultValue,
): [DependencyMap, AtomValues] {
  const node = getNode(key);
  if (node.set == null) {
    throw new ReadOnlyRecoilValueError(
      `Attempt to set read-only RecoilValue: ${key}`,
    );
  }
  return node.set(store, state, newValue);
}

// Find all of the recursively dependent nodes
function getDownstreamNodes(
  store: Store,
  state: TreeState,
  keys: $ReadOnlySet<NodeKey>,
): $ReadOnlySet<NodeKey> {
  const dependentNodes = new Set();
  const visitedNodes = new Set();
  const visitingNodes = Array.from(keys);
  for (let key = visitingNodes.pop(); key; key = visitingNodes.pop()) {
    dependentNodes.add(key);
    visitedNodes.add(key);
    const subscribedNodes =
      store.getGraph(state.version).nodeToNodeSubscriptions.get(key) ??
      emptySet;
    for (const downstreamNode of subscribedNodes) {
      if (!visitedNodes.has(downstreamNode)) {
        visitingNodes.push(downstreamNode);
      }
    }
  }
  return dependentNodes;
}

// Fire or enqueue callbacks to rerender components that are subscribed to
// nodes affected by the updatedNodes
function fireNodeSubscriptions(
  store: Store,
  updatedNodes: $ReadOnlySet<NodeKey>,
  when: 'enqueue' | 'now',
) {
  /*
  This is called in two conditions: When an atom is set (with 'enqueue') and
  when an async selector resolves (with 'now'). When an atom is set, we want
  to use the latest dependencies that may have become dependencies due to
  earlier changes in a batch. But if an async selector happens to resolve during
  a batch, it should use the currently rendered output, and then the end of the
  batch will trigger any further subscriptions due to new deps in the new state.
  */
  const state =
    when === 'enqueue'
      ? store.getState().nextTree ?? store.getState().currentTree
      : store.getState().currentTree;

  const callOrQueue =
    when === 'enqueue'
      ? cb => store.getState().queuedComponentCallbacks.push(cb)
      : cb => cb(state);

  const dependentNodes = getDownstreamNodes(store, state, updatedNodes);
  for (const key of dependentNodes) {
    const subscribers =
      store.getState().nodeToComponentSubscriptions.get(key) ?? [];
    subscribers.forEach(([_debugName, cb]) => callOrQueue(cb));
  }

  // Wake all suspended components so the right one(s) can try to re-render.
  // We need to wake up components not just when some asynchronous selector
  // resolved (when === 'now'), but also when changing synchronous values because
  // they may cause a selector to change from asynchronous to synchronous, in
  // which case there would be no follow-up asynchronous resolution to wake us up.
  // TODO OPTIMIZATION Only wake up related downstream components
  const nodeNames = Array.from(updatedNodes).join(', ');
  const resolvers = store.getState().suspendedComponentResolvers;
  resolvers.forEach(cb =>
    callOrQueue(_state =>
      Tracing.trace('value became available, waking components', nodeNames, cb),
    ),
  );
}

module.exports = {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  setUnvalidatedAtomValue,
  fireNodeSubscriptions,
};
