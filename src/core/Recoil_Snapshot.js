/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+obviz
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from '../adt/Recoil_Loadable';
import type {
  ResetRecoilState,
  SetRecoilState,
  ValueOrUpdater,
} from '../recoil_values/Recoil_selector';
import type {RecoilValueInfo} from './Recoil_FunctionalCore';
import type {NodeKey} from './Recoil_Keys';
import type {RecoilState, RecoilValue} from './Recoil_RecoilValue';
import type {StateID, Store, StoreState, TreeState} from './Recoil_State';

const concatIterables = require('../util/Recoil_concatIterables');
const filterIterable = require('../util/Recoil_filterIterable');
const nullthrows = require('../util/Recoil_nullthrows');
const {batchUpdates} = require('./Recoil_Batching');
const {getDownstreamNodes, peekNodeInfo} = require('./Recoil_FunctionalCore');
const {graph} = require('./Recoil_Graph');
const {
  DEFAULT_VALUE,
  recoilValues,
  recoilValuesForKeys,
} = require('./Recoil_Node');
const {
  AbstractRecoilValue,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
} = require('./Recoil_RecoilValueInterface');
const {
  getNextTreeStateVersion,
  makeEmptyStoreState,
} = require('./Recoil_State');

// Opaque at this surface because it's part of the public API from here.
export opaque type SnapshotID = StateID;

// A "Snapshot" is "read-only" and captures a specific set of values of atoms.
// However, the data-flow-graph and selector values may evolve as selector
// evaluation functions are executed and async selectors resolve.
class Snapshot {
  _store: Store;

  constructor(storeState: StoreState) {
    this._store = {
      getState: () => storeState,
      replaceState: replacer => {
        storeState.currentTree = replacer(storeState.currentTree); // no batching so nextTree is never active
      },
      getGraph: version => {
        const graphs = storeState.graphsByVersion;
        if (graphs.has(version)) {
          return nullthrows(graphs.get(version));
        }
        const newGraph = graph();
        graphs.set(version, newGraph);
        return newGraph;
      },
      subscribeToTransactions: () => ({release: () => {}}),
      addTransactionMetadata: () => {
        throw new Error('Cannot subscribe to Snapshots');
      },
    };
  }

  getStore_INTERNAL(): Store {
    return this._store;
  }

  getID(): SnapshotID {
    return this.getID_INTERNAL();
  }

  getID_INTERNAL(): StateID {
    return this._store.getState().currentTree.stateID;
  }

  getLoadable: <T>(RecoilValue<T>) => Loadable<T> = <T>(
    recoilValue: RecoilValue<T>,
    // $FlowFixMe[escaped-generic]
  ) => getRecoilValueAsLoadable(this._store, recoilValue);

  getPromise: <T>(RecoilValue<T>) => Promise<T> = <T>(
    recoilValue: RecoilValue<T>,
    // $FlowFixMe[escaped-generic]
  ) => this.getLoadable(recoilValue).toPromise();

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getNodes_UNSTABLE: (
    {
      isModified?: boolean,
      isInitialized?: boolean,
    } | void,
  ) => Iterable<RecoilValue<mixed>> = opt => {
    // TODO Deal with modified selectors
    if (opt?.isModified === true) {
      if (opt?.isInitialized === false) {
        return [];
      }
      const state = this._store.getState().currentTree;
      return recoilValuesForKeys(state.dirtyAtoms);
    }
    const knownAtoms = this._store.getState().knownAtoms;
    const knownSelectors = this._store.getState().knownSelectors;

    return opt?.isInitialized == null
      ? recoilValues.values()
      : opt.isInitialized === true
      ? recoilValuesForKeys(
          concatIterables([
            this._store.getState().knownAtoms,
            this._store.getState().knownSelectors,
          ]),
        )
      : filterIterable(
          recoilValues.values(),
          ({key}) => !knownAtoms.has(key) && !knownSelectors.has(key),
        );
  };

  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getDeps_UNSTABLE: <T>(RecoilValue<T>) => Iterable<RecoilValue<mixed>> = <T>(
    recoilValue: RecoilValue<T>,
  ) => {
    this.getLoadable(recoilValue); // Evaluate node to ensure deps are up-to-date
    const deps = this._store
      .getGraph(this._store.getState().currentTree.version)
      .nodeDeps.get(recoilValue.key);
    return recoilValuesForKeys(deps ?? []);
  };

  // This reports all "current" subscribers.  It does not report all possible
  // downstream nodes.  Evaluating other nodes may introduce new subscribers.
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getSubscribers_UNSTABLE: <T>(
    RecoilValue<T>,
  ) => {
    nodes: Iterable<RecoilValue<mixed>>,
    // TODO components, observers, and atom effects
  } = <T>({key}: RecoilValue<T>) => {
    const state = this._store.getState().currentTree;
    const downstreamNodes = filterIterable(
      getDownstreamNodes(this._store, state, new Set([key])),
      nodeKey => nodeKey !== key,
    );

    return {
      nodes: recoilValuesForKeys(downstreamNodes),
    };
  };

  // Report the current status of a node.
  // This peeks the current state and does not affect the snapshot state at all
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getInfo_UNSTABLE: <T>(RecoilValue<T>) => RecoilValueInfo<T> = <T>({
    key,
  }: RecoilValue<T>) =>
    peekNodeInfo(this._store, this._store.getState().currentTree, key);

  // eslint-disable-next-line fb-www/extra-arrow-initializer
  map: ((MutableSnapshot) => void) => Snapshot = mapper => {
    const mutableSnapshot = new MutableSnapshot(this);
    mapper(mutableSnapshot); // if removing batchUpdates from `set` add it here
    return cloneSnapshot(mutableSnapshot.getStore_INTERNAL());
  };

  // eslint-disable-next-line fb-www/extra-arrow-initializer
  asyncMap: (
    (MutableSnapshot) => Promise<void>,
  ) => Promise<Snapshot> = async mapper => {
    const mutableSnapshot = new MutableSnapshot(this);
    await mapper(mutableSnapshot);
    return cloneSnapshot(mutableSnapshot.getStore_INTERNAL());
  };
}

function cloneStoreState(
  store: Store,
  treeState: TreeState,
  bumpVersion: boolean = false,
): StoreState {
  const storeState = store.getState();
  const version = bumpVersion ? getNextTreeStateVersion() : treeState.version;
  return {
    currentTree: bumpVersion
      ? {
          // TODO snapshots shouldn't really have versions because a new version number
          // is always assigned when the snapshot is gone to.
          version,
          stateID: version,
          transactionMetadata: {...treeState.transactionMetadata},
          dirtyAtoms: new Set(treeState.dirtyAtoms),
          atomValues: treeState.atomValues.clone(),
          nonvalidatedAtoms: treeState.nonvalidatedAtoms.clone(),
        }
      : treeState,
    nextTree: null,
    previousTree: null,
    knownAtoms: new Set(storeState.knownAtoms), // FIXME here's a copy
    knownSelectors: new Set(storeState.knownSelectors), // FIXME here's a copy
    transactionSubscriptions: new Map(),
    nodeTransactionSubscriptions: new Map(),
    nodeToComponentSubscriptions: new Map(),
    queuedComponentCallbacks_DEPRECATED: [],
    suspendedComponentResolvers: new Set(),
    graphsByVersion: new Map().set(version, store.getGraph(treeState.version)),
    versionsUsedByComponent: new Map(),
  };
}

// Factory to build a fresh snapshot
function freshSnapshot(initializeState?: MutableSnapshot => void): Snapshot {
  const snapshot = new Snapshot(makeEmptyStoreState());
  return initializeState != null ? snapshot.map(initializeState) : snapshot;
}

// Factory to clone a snapahot state
function cloneSnapshot(
  store: Store,
  version: 'current' | 'previous' = 'current',
): Snapshot {
  const storeState = store.getState();
  const treeState =
    version === 'current'
      ? storeState.currentTree
      : nullthrows(storeState.previousTree);
  return new Snapshot(cloneStoreState(store, treeState));
}

class MutableSnapshot extends Snapshot {
  constructor(snapshot: Snapshot) {
    super(
      cloneStoreState(
        snapshot.getStore_INTERNAL(),
        snapshot.getStore_INTERNAL().getState().currentTree,
        true,
      ),
    );
  }

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  set: SetRecoilState = <T>(
    recoilState: RecoilState<T>,
    newValueOrUpdater: ValueOrUpdater<T>,
  ) => {
    const store = this.getStore_INTERNAL();
    // This batchUpdates ensures this `set` is applied immediately and you can
    // read the written value after calling `set`. I would like to remove this
    // behavior and only batch in `Snapshot.map`, but this would be a breaking
    // change potentially.
    batchUpdates(() => {
      setRecoilValue(store, recoilState, newValueOrUpdater);
    });
  };

  // $FlowFixMe[escaped-generic]
  reset: ResetRecoilState = recoilState =>
    // See note at `set` about batched updates.
    batchUpdates(() =>
      setRecoilValue(this.getStore_INTERNAL(), recoilState, DEFAULT_VALUE),
    );

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  setUnvalidatedAtomValues_DEPRECATED: (Map<NodeKey, mixed>) => void = (
    values: Map<NodeKey, mixed>,
  ) => {
    const store = this.getStore_INTERNAL();
    batchUpdates(() => {
      for (const [k, v] of values.entries()) {
        setUnvalidatedRecoilValue(store, new AbstractRecoilValue(k), v);
      }
    });
  };
}

module.exports = {
  Snapshot,
  MutableSnapshot,
  freshSnapshot,
  cloneSnapshot,
};
