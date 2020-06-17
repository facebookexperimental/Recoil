/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */
'use strict';

import type {Loadable} from '../adt/Recoil_Loadable';

export type NodeKey = string;

// TODO We could just store T instead of a Loadable<T> in atomValues
// flowlint-next-line unclear-type:off
export type AtomValues = Map<NodeKey, Loadable<any>>;

type ComponentCallback = TreeState => void;

export type TreeState = $ReadOnly<{
  // Information about the TreeState itself:
  transactionMetadata: {...},
  dirtyAtoms: Set<NodeKey>,

  // ATOMS
  atomValues: AtomValues,
  nonvalidatedAtoms: Map<NodeKey, mixed>,

  // NODE GRAPH
  // Upstream Node dependencies
  nodeDeps: Map<NodeKey, Set<NodeKey>>,
  // Downstream Node subscriptions
  nodeToNodeSubscriptions: Map<NodeKey, Set<NodeKey>>,
  // TODO -- will soon move to StoreState
  nodeToComponentSubscriptions: Map<
    NodeKey,
    Map<number, [string, ComponentCallback]>,
  >,
}>;

// StoreState represents the state of a Recoil context. It is global and mutable.
// It is updated only during effects, except that the nextTree property is updated
// when atom values change and async requests resolve, and suspendedComponentResolvers
// is updated when components are suspended.
export type StoreState = {
  // The "current" TreeState being either directly read from (legacy) or passed
  // to useMutableSource (when in use). It is replaced with nextTree when
  // a transaction is completed or async request finishes:
  currentTree: TreeState,

  // The TreeState that is written to when during the course of a transaction
  // (generally equal to a React batch) when atom values are updated.
  nextTree: null | TreeState,

  // For observing transactions:
  +transactionSubscriptions: Map<number, (Store) => void>,

  // Callbacks to render external components that are subscribed to nodes
  // These are executed at the end of the transaction or asynchronously.
  +queuedComponentCallbacks: Array<ComponentCallback>,

  // Promise resolvers to wake any components we suspended with React Suspense
  +suspendedComponentResolvers: Set<() => void>,
};

export type Store = $ReadOnly<{
  getState: () => StoreState,
  replaceState: ((TreeState) => TreeState) => void,
  subscribeToTransactions: ((Store) => void) => {release: () => void},
  addTransactionMetadata: ({...}) => void,
  fireNodeSubscriptions: (
    updatedNodes: $ReadOnlySet<NodeKey>,
    when: 'enqueue' | 'now',
  ) => void,
}>;

export type StoreRef = {
  current: Store,
};

function makeEmptyTreeState(): TreeState {
  return {
    transactionMetadata: {},
    atomValues: new Map(),
    nonvalidatedAtoms: new Map(),
    dirtyAtoms: new Set(),
    nodeDeps: new Map(),
    nodeToNodeSubscriptions: new Map(),
    nodeToComponentSubscriptions: new Map(),
  };
}

function makeStoreState(treeState: TreeState): StoreState {
  return {
    currentTree: treeState,
    nextTree: null,
    transactionSubscriptions: new Map(),
    queuedComponentCallbacks: [],
    suspendedComponentResolvers: new Set(),
  };
}

function makeEmptyStoreState(): StoreState {
  return makeStoreState(makeEmptyTreeState());
}

module.exports = {
  makeEmptyTreeState,
  makeEmptyStoreState,
  makeStoreState,
};
