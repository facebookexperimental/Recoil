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
import type {
  ResetRecoilState,
  SetRecoilState,
  ValueOrUpdater,
} from '../recoil_values/Recoil_callbackTypes';
import type {RecoilValueInfo} from './Recoil_FunctionalCore';
import type {NodeKey} from './Recoil_Keys';
import type {RecoilState, RecoilValue} from './Recoil_RecoilValue';
import type {StateID, Store, StoreState, TreeState} from './Recoil_State';

const {batchUpdates} = require('./Recoil_Batching');
const {initializeNode, peekNodeInfo} = require('./Recoil_FunctionalCore');
const {graph} = require('./Recoil_Graph');
const {getNextStoreID} = require('./Recoil_Keys');
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
const {updateRetainCount} = require('./Recoil_Retention');
const {
  getNextTreeStateVersion,
  makeEmptyStoreState,
} = require('./Recoil_State');
const concatIterables = require('recoil-shared/util/Recoil_concatIterables');
const {isSSR} = require('recoil-shared/util/Recoil_Environment');
const err = require('recoil-shared/util/Recoil_err');
const filterIterable = require('recoil-shared/util/Recoil_filterIterable');
const gkx = require('recoil-shared/util/Recoil_gkx');
const mapIterable = require('recoil-shared/util/Recoil_mapIterable');
const nullthrows = require('recoil-shared/util/Recoil_nullthrows');
const recoverableViolation = require('recoil-shared/util/Recoil_recoverableViolation');

// Opaque at this surface because it's part of the public API from here.
export type SnapshotID = StateID;

const retainWarning = `
Recoil Snapshots only last for the duration of the callback they are provided to. To keep a Snapshot longer, do this:

  const release = snapshot.retain();
  try {
    await useTheSnapshotAsynchronously(snapshot);
  } finally {
    release();
  }

This is currently a DEV-only warning but will become a thrown exception in the next release of Recoil.
`;

// A "Snapshot" is "read-only" and captures a specific set of values of atoms.
// However, the data-flow-graph and selector values may evolve as selector
// evaluation functions are executed and async selectors resolve.
class Snapshot {
  _store: Store;
  _refCount: number = 0;

  constructor(storeState: StoreState) {
    this._store = {
      storeID: getNextStoreID(),
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
        throw err('Cannot subscribe to Snapshots');
      },
    };
    // Initialize any nodes that are live in the parent store (primarily so that
    // this snapshot gets counted towards the node's live stores count).
    // TODO Optimize this when cloning snapshots for callbacks
    for (const nodeKey of this._store.getState().knownAtoms) {
      initializeNode(this._store, nodeKey);
      updateRetainCount(this._store, nodeKey, 1);
    }
    this.retain();
    this._autoRelease();
  }

  retain(): () => void {
    this._refCount++;
    let released = false;
    return () => {
      if (!released) {
        released = true;
        this._release();
      }
    };
  }

  /**
   * Release the snapshot on the next tick.  This means the snapshot is retained
   * during the execution of the current function using it.
   */
  _autoRelease(): void {
    if (!isSSR) {
      window.setTimeout(() => this._release(), 0);
    }
  }

  _release(): void {
    this._refCount--;
    if (this._refCount === 0) {
      this._store.getState().nodeCleanupFunctions.forEach(cleanup => cleanup());
      this._store.getState().nodeCleanupFunctions.clear();

      if (!gkx('recoil_memory_managament_2020')) {
        return;
      }
      // Temporarily nerfing this to allow us to find broken call sites without
      // actually breaking anybody yet.
      // for (const k of this._store.getState().knownAtoms) {
      //   updateRetainCountToZero(this._store, k);
      // }
    }
  }

  checkRefCount_INTERNAL(): void {
    if (gkx('recoil_memory_managament_2020') && this._refCount <= 0) {
      if (__DEV__) {
        recoverableViolation(retainWarning, 'recoil');
      }
      // What we will ship later:
      // throw err(retainWarning);
    }
  }

  getStore_INTERNAL(): Store {
    this.checkRefCount_INTERNAL();
    return this._store;
  }

  getID(): SnapshotID {
    this.checkRefCount_INTERNAL();
    return this._store.getState().currentTree.stateID;
  }

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getLoadable: <T>(RecoilValue<T>) => Loadable<T> = <T>(
    recoilValue: RecoilValue<T>,
  ): Loadable<T> => {
    this.checkRefCount_INTERNAL();
    return getRecoilValueAsLoadable(this._store, recoilValue);
  };

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getPromise: <T>(RecoilValue<T>) => Promise<T> = <T>(
    recoilValue: RecoilValue<T>,
  ): Promise<T> => {
    this.checkRefCount_INTERNAL();
    return this.getLoadable(recoilValue).toPromise();
  };

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getNodes_UNSTABLE: (
    {
      isModified?: boolean,
      isInitialized?: boolean,
    } | void,
  ) => Iterable<RecoilValue<mixed>> = opt => {
    this.checkRefCount_INTERNAL();

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

  // Report the current status of a node.
  // This peeks the current state and does not affect the snapshot state at all
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getInfo_UNSTABLE: <T>(RecoilValue<T>) => RecoilValueInfo<T> = <T>({
    key,
  }: RecoilValue<T>) => {
    this.checkRefCount_INTERNAL();
    // $FlowFixMe[escaped-generic]
    return peekNodeInfo(this._store, this._store.getState().currentTree, key);
  };

  // eslint-disable-next-line fb-www/extra-arrow-initializer
  map: ((MutableSnapshot) => void) => Snapshot = mapper => {
    this.checkRefCount_INTERNAL();
    const mutableSnapshot = new MutableSnapshot(this, batchUpdates);
    mapper(mutableSnapshot); // if removing batchUpdates from `set` add it here
    return cloneSnapshot(mutableSnapshot.getStore_INTERNAL());
  };

  // eslint-disable-next-line fb-www/extra-arrow-initializer
  asyncMap: ((MutableSnapshot) => Promise<void>) => Promise<Snapshot> =
    async mapper => {
      this.checkRefCount_INTERNAL();
      const mutableSnapshot = new MutableSnapshot(this, batchUpdates);
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
    commitDepth: 0,
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
    retention: {
      referenceCounts: new Map(),
      nodesRetainedByZone: new Map(),
      retainablesToCheckForRelease: new Set(),
    },
    // FIXME here's a copy
    // Create blank cleanup handlers for atoms so snapshots don't re-run
    // atom effects.
    nodeCleanupFunctions: new Map(
      mapIterable(storeState.nodeCleanupFunctions.entries(), ([key]) => [
        key,
        () => {},
      ]),
    ),
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
  _batch: (() => void) => void;

  constructor(snapshot: Snapshot, batch: (() => void) => void) {
    super(
      cloneStoreState(
        snapshot.getStore_INTERNAL(),
        snapshot.getStore_INTERNAL().getState().currentTree,
        true,
      ),
    );
    this._batch = batch;
  }

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  set: SetRecoilState = <T>(
    recoilState: RecoilState<T>,
    newValueOrUpdater: ValueOrUpdater<T>,
  ) => {
    this.checkRefCount_INTERNAL();
    const store = this.getStore_INTERNAL();
    // This batchUpdates ensures this `set` is applied immediately and you can
    // read the written value after calling `set`. I would like to remove this
    // behavior and only batch in `Snapshot.map`, but this would be a breaking
    // change potentially.
    this._batch(() => {
      updateRetainCount(store, recoilState.key, 1);
      setRecoilValue(this.getStore_INTERNAL(), recoilState, newValueOrUpdater);
    });
  };

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  reset: ResetRecoilState = <T>(recoilState: RecoilState<T>) => {
    this.checkRefCount_INTERNAL();
    const store = this.getStore_INTERNAL();
    // See note at `set` about batched updates.
    this._batch(() => {
      updateRetainCount(store, recoilState.key, 1);
      setRecoilValue(this.getStore_INTERNAL(), recoilState, DEFAULT_VALUE);
    });
  };

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  setUnvalidatedAtomValues_DEPRECATED: (Map<NodeKey, mixed>) => void = (
    values: Map<NodeKey, mixed>,
  ) => {
    this.checkRefCount_INTERNAL();
    const store = this.getStore_INTERNAL();
    // See note at `set` about batched updates.
    batchUpdates(() => {
      for (const [k, v] of values.entries()) {
        updateRetainCount(store, k, 1);
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
