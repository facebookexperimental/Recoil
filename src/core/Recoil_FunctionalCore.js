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
import type {DefaultValue} from './Recoil_Node';
import type {NodeKey, Store, TreeState} from './Recoil_State';

const {
  mapByDeletingFromMap,
  mapBySettingInMap,
  mapByUpdatingInMap,
  setByAddingToSet,
} = require('../util/Recoil_CopyOnWrite');
const Tracing = require('../util/Recoil_Tracing');
const {getNode} = require('./Recoil_Node');

// flowlint-next-line unclear-type:off
const emptyMap: $ReadOnlyMap<any, any> = Object.freeze(new Map());
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
): [TreeState, Loadable<T>] {
  return getNode(key).get(store, state);
}

// Peek at the current value loadable for a node.
// NOTE: This will ignore updating the state for subscriptions so use sparingly!!
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

// Set a node value and return the set of nodes that were actually written.
// That does not include any downstream nodes which are dependent on them.
function setNodeValue<T>(
  store: Store,
  state: TreeState,
  key: NodeKey,
  newValue: T | DefaultValue,
): [TreeState, $ReadOnlySet<NodeKey>] {
  const node = getNode(key);
  if (node.set == null) {
    throw new ReadOnlyRecoilValueError(
      `Attempt to set read-only RecoilValue: ${key}`,
    );
  }
  const [newState, writtenNodes] = node.set(store, state, newValue);
  return [newState, writtenNodes];
}

// Find all of the recursively dependent nodes
function getDownstreamNodes(
  state: TreeState,
  keys: $ReadOnlySet<NodeKey>,
): $ReadOnlySet<NodeKey> {
  const dependentNodes = new Set();
  const visitedNodes = new Set();
  const visitingNodes = Array.from(keys);
  for (let key = visitingNodes.pop(); key; key = visitingNodes.pop()) {
    dependentNodes.add(key);
    visitedNodes.add(key);
    const subscribedNodes = state.nodeToNodeSubscriptions.get(key) ?? emptySet;
    for (const downstreamNode of subscribedNodes) {
      if (!visitedNodes.has(downstreamNode)) {
        visitingNodes.push(downstreamNode);
      }
    }
  }
  return dependentNodes;
}

let subscriptionID = 0;
function subscribeComponentToNode(
  state: TreeState,
  key: NodeKey,
  callback: TreeState => void,
): [TreeState, (TreeState) => TreeState] {
  const subID = subscriptionID++;

  const newState = {
    ...state,
    nodeToComponentSubscriptions: mapByUpdatingInMap(
      state.nodeToComponentSubscriptions,
      key,
      subsForAtom =>
        mapBySettingInMap(subsForAtom ?? emptyMap, subID, [
          'TODO debug name',
          callback,
        ]),
    ),
  };

  function release(state: TreeState): TreeState {
    const newState = {
      ...state,
      nodeToComponentSubscriptions: mapByUpdatingInMap(
        state.nodeToComponentSubscriptions,
        key,
        subsForAtom => mapByDeletingFromMap(subsForAtom ?? emptyMap, subID),
      ),
    };
    return newState;
  }

  return [newState, release];
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

  const dependentNodes = getDownstreamNodes(state, updatedNodes);

  for (const key of dependentNodes) {
    (state.nodeToComponentSubscriptions.get(key) ?? []).forEach(
      ([_debugName, cb]) => {
        when === 'enqueue'
          ? store.getState().queuedComponentCallbacks.push(cb)
          : cb(state);
      },
    );
  }

  // Wake all suspended components so the right one(s) can try to re-render.
  // We need to wake up components not just when some asynchronous selector
  // resolved (when === 'now'), but also when changing synchronous values because
  // they may cause a selector to change from asynchronous to synchronous, in
  // which case there would be no follow-up asynchronous resolution to wake us up.
  // TODO OPTIMIZATION Only wake up related downstream components
  Tracing.trace(
    'value became available, waking components',
    Array.from(updatedNodes).join(', '),
    () => {
      const resolvers = store.getState().suspendedComponentResolvers;
      resolvers.forEach(r => r());
      resolvers.clear();
    },
  );
}

function detectCircularDependencies(
  state: TreeState,
  stack: $ReadOnlyArray<NodeKey>,
) {
  if (!stack.length) {
    return;
  }
  const leaf = stack[stack.length - 1];
  const downstream = state.nodeToNodeSubscriptions.get(leaf);
  if (!downstream?.size) {
    return;
  }
  const root = stack[0];
  if (downstream.has(root)) {
    throw new Error(
      `Recoil selector has circular dependencies: ${[...stack, root]
        .reverse()
        .join(' \u2192 ')}`,
    );
  }
  for (const next of downstream) {
    detectCircularDependencies(state, [...stack, next]);
  }
}

module.exports = {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  setUnvalidatedAtomValue,
  subscribeComponentToNode,
  getDownstreamNodes,
  fireNodeSubscriptions,
  detectCircularDependencies,
};
