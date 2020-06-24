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
import type {RecoilState, RecoilValue} from './Recoil_RecoilValue';
import type {Store, TreeState} from './Recoil_State';

const gkx = require('../util/Recoil_gkx');
const mapMap = require('../util/Recoil_mapMap');
const nullthrows = require('../util/Recoil_nullthrows');
const {getDownstreamNodes} = require('./Recoil_FunctionalCore');
const {DEFAULT_VALUE, recoilValues} = require('./Recoil_Node');
const {
  getRecoilValueAsLoadable,
  setRecoilValue,
  valueFromValueOrUpdater,
} = require('./Recoil_RecoilValueInterface');
const {makeEmptyTreeState, makeStoreState} = require('./Recoil_State');

function makeStore(treeState: TreeState): Store {
  const storeState = makeStoreState(treeState);
  const store = {
    getState: () => storeState,
    replaceState: replacer => {
      storeState.currentTree = replacer(storeState.currentTree); // no batching so nextTree is never active
    },
    subscribeToTransactions: () => {
      throw new Error('Cannot subscribe to Snapshots');
    },
    addTransactionMetadata: () => {
      throw new Error('Cannot subscribe to Snapshots');
    },
    fireNodeSubscriptions: () => {},
  };
  return store;
}

// A "Snapshot" is "read-only" and captures a specific set of values of atoms.
// However, the data-flow-graph and selector values may evolve as selector
// evaluation functions are executed and async selectors resolve.
class Snapshot {
  _store: Store;

  constructor(treeState: TreeState) {
    this._store = makeStore(treeState);
  }

  getStore_INTERNAL(): Store {
    return this._store;
  }

  getLoadable: <T>(RecoilValue<T>) => Loadable<T> = <T>(
    recoilValue: RecoilValue<T>,
  ) => getRecoilValueAsLoadable(this._store, recoilValue);

  getPromise: <T>(RecoilValue<T>) => Promise<T> = <T>(
    recoilValue: RecoilValue<T>,
  ) =>
    gkx('recoil_async_selector_refactor')
      ? this.getLoadable(recoilValue)
          .toPromise()
          .then(({value}) => value)
      : (this.getLoadable(recoilValue).toPromise(): $FlowFixMe);

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getNodes_UNSTABLE: (
    {
      types?: $ReadOnlyArray<'atom' | 'selector'>,
      dirty?: boolean,
    } | void,
  ) => Iterable<RecoilValue<mixed>> = opt => {
    const state = this._store.getState().currentTree;
    const atoms = opt?.dirty === true ? state.dirtyAtoms : state.knownAtoms;
    // TODO mark dirty selectors
    const selectors = opt?.dirty === true ? new Set() : state.knownSelectors;
    const types = opt?.types ?? ['atom', 'selector'];

    return (function*() {
      for (const type of types) {
        const keys = {atom: atoms, selector: selectors}[type];
        for (const key of keys) {
          yield nullthrows(recoilValues.get(key));
        }
      }
    })();
  };

  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getDeps_UNSTABLE: <T>(RecoilValue<T>) => Iterable<RecoilValue<mixed>> = <T>(
    recoilValue: RecoilValue<T>,
  ) => {
    this.getLoadable(recoilValue); // Evaluate node to ensure deps are up-to-date
    const deps = this._store
      .getState()
      .currentTree.nodeDeps.get(recoilValue.key);
    return (function*() {
      for (const key of deps ?? []) {
        yield nullthrows(recoilValues.get(key));
      }
    })();
  };

  // This reports all "current" subscribers.  It does not report all possible
  // downstream nodes.  Evaluating other nodes may introduce new subscribers.
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  getSubscribers_UNSTABLE: <T>(
    RecoilValue<T>,
  ) => {
    nodes: Iterable<RecoilValue<mixed>>,
    // TODO components, observers, and effects
    // An issue is that Snapshots don't include subscriptions...
  } = <T>({key}: RecoilValue<T>) => {
    const state = this._store.getState().currentTree;
    const downstreamNodes = getDownstreamNodes(state, new Set([key]));

    return {
      nodes: (function*() {
        for (const node of downstreamNodes) {
          if (node === key) {
            continue;
          }
          yield nullthrows(recoilValues.get(node));
        }
      })(),
    };
  };

  // eslint-disable-next-line fb-www/extra-arrow-initializer
  map: ((MutableSnapshot) => void) => Snapshot = mapper => {
    const mutableSnapshot = new MutableSnapshot(
      this._store.getState().currentTree,
    );
    mapper(mutableSnapshot);
    const newState = mutableSnapshot.getStore_INTERNAL().getState().currentTree;
    return cloneSnapshot(newState);
  };

  // eslint-disable-next-line fb-www/extra-arrow-initializer
  asyncMap: (
    (MutableSnapshot) => Promise<void>,
  ) => Promise<Snapshot> = async mapper => {
    const mutableSnapshot = new MutableSnapshot(
      this._store.getState().currentTree,
    );
    await mapper(mutableSnapshot);
    const newState = mutableSnapshot.getStore_INTERNAL().getState().currentTree;
    return cloneSnapshot(newState);
  };
}

function cloneTreeState(treeState: TreeState): TreeState {
  return {
    transactionMetadata: {...treeState.transactionMetadata},
    knownAtoms: new Set(treeState.knownAtoms),
    dirtyAtoms: new Set(treeState.dirtyAtoms),
    atomValues: new Map(treeState.atomValues),
    nonvalidatedAtoms: new Map(treeState.nonvalidatedAtoms),
    knownSelectors: new Set(treeState.knownSelectors),
    nodeDeps: new Map(treeState.nodeDeps),
    nodeToNodeSubscriptions: mapMap(
      treeState.nodeToNodeSubscriptions,
      keys => new Set(keys),
    ),
    nodeToComponentSubscriptions: new Map(),
  };
}

// Factory to build a fresh snapshot
function freshSnapshot(): Snapshot {
  return new Snapshot(makeEmptyTreeState());
}

// Factory to clone a snapahot state
function cloneSnapshot(treeState: TreeState): Snapshot {
  return new Snapshot(cloneTreeState(treeState));
}

class MutableSnapshot extends Snapshot {
  constructor(treeState: TreeState) {
    super(cloneTreeState(treeState));
  }

  // We want to allow the methods to be destructured and used as accessors
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  set: SetRecoilState = <T>(
    recoilState: RecoilState<T>,
    newValueOrUpdater: ValueOrUpdater<T>,
  ) => {
    const store = this.getStore_INTERNAL();
    const newValue = valueFromValueOrUpdater(
      store,
      recoilState,
      newValueOrUpdater,
    );
    setRecoilValue(store, recoilState, newValue);
  };

  reset: ResetRecoilState = recoilState =>
    setRecoilValue(this.getStore_INTERNAL(), recoilState, DEFAULT_VALUE);
}

module.exports = {
  Snapshot,
  MutableSnapshot,
  freshSnapshot,
  cloneSnapshot,
};
