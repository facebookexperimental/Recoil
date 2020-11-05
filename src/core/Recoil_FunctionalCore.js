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
import type {DependencyMap} from './Recoil_Graph';
import type {DefaultValue} from './Recoil_Node';
import type {RecoilValue} from './Recoil_RecoilValue';
import type {AtomValues, NodeKey, Store, TreeState} from './Recoil_State';

const {
  mapByDeletingFromMap,
  mapBySettingInMap,
  setByAddingToSet,
} = require('../util/Recoil_CopyOnWrite');
const filterIterable = require('../util/Recoil_filterIterable');
const {getNode, getNodeMaybe, recoilValuesForKeys} = require('./Recoil_Node');

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

// Peek at the current value loadable for a node without any evaluation or state change
function peekNodeLoadable<T>(
  store: Store,
  state: TreeState,
  key: NodeKey,
): ?Loadable<T> {
  return getNode(key).peek(store, state);
}

// Write value directly to state bypassing the Node interface as the node
// definitions may not have been loaded yet when processing the initial snapshot.
function setUnvalidatedAtomValue_DEPRECATED<T>(
  state: TreeState,
  key: NodeKey,
  newValue: T,
): TreeState {
  const node = getNodeMaybe(key);
  node?.invalidate?.(state);

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

function cleanUpNode(store: Store, key: NodeKey) {
  const node = getNode(key);
  node.cleanUp(store);
}

export type RecoilValueInfo<T> = {
  loadable: ?Loadable<T>,
  isActive: boolean,
  isSet: boolean,
  isModified: boolean, // TODO report modified selectors
  type: 'atom' | 'selector' | void, // void until initialized for now
  deps: Iterable<RecoilValue<mixed>>,
  subscribers: {
    nodes: Iterable<RecoilValue<mixed>>,
  },
};

function peekNodeInfo<T>(
  store: Store,
  state: TreeState,
  key: NodeKey,
): RecoilValueInfo<T> {
  const storeState = store.getState();
  const graph = store.getGraph(state.version);
  const type = storeState.knownAtoms.has(key)
    ? 'atom'
    : storeState.knownSelectors.has(key)
    ? 'selector'
    : undefined;
  const downstreamNodes = filterIterable(
    getDownstreamNodes(store, state, new Set([key])),
    nodeKey => nodeKey !== key,
  );
  return {
    loadable: peekNodeLoadable(store, state, key),
    isActive:
      storeState.knownAtoms.has(key) || storeState.knownSelectors.has(key),
    isSet: type === 'selector' ? false : state.atomValues.has(key),
    isModified: state.dirtyAtoms.has(key),
    type,
    deps: recoilValuesForKeys(graph.nodeDeps.get(key) ?? []),
    subscribers: {
      nodes: recoilValuesForKeys(downstreamNodes),
    },
  };
}

// Find all of the recursively dependent nodes
function getDownstreamNodes(
  store: Store,
  state: TreeState,
  keys: $ReadOnlySet<NodeKey>,
): $ReadOnlySet<NodeKey> {
  const visitedNodes = new Set();
  const visitingNodes = Array.from(keys);
  const graph = store.getGraph(state.version);

  for (let key = visitingNodes.pop(); key; key = visitingNodes.pop()) {
    visitedNodes.add(key);
    const subscribedNodes = graph.nodeToNodeSubscriptions.get(key) ?? emptySet;
    for (const downstreamNode of subscribedNodes) {
      if (!visitedNodes.has(downstreamNode)) {
        visitingNodes.push(downstreamNode);
      }
    }
  }
  return visitedNodes;
}

module.exports = {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  cleanUpNode,
  setUnvalidatedAtomValue_DEPRECATED,
  peekNodeInfo,
  getDownstreamNodes,
};
