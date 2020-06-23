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
const {DEFAULT_VALUE} = require('./Recoil_Node');
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
    atomValues: new Map(treeState.atomValues),
    nonvalidatedAtoms: new Map(treeState.nonvalidatedAtoms),
    dirtyAtoms: new Set(treeState.dirtyAtoms),
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
