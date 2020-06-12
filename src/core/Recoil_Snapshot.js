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
import type {RecoilValue} from './Recoil_RecoilValue';
import type {Store, TreeState} from './Recoil_State';

const mapMap = require('../util/Recoil_mapMap');
const {getRecoilValueAsLoadable} = require('./Recoil_RecoilValue');
const {makeEmptyTreeState, makeStoreState} = require('./Recoil_State');
const gkx = require('gkx');

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
}

// Factory to build a fresh snapshot
function freshSnapshot(): Snapshot {
  return new Snapshot(makeEmptyTreeState());
}

// Factory to clone a snapahot state
function cloneSnapshot(treeState: TreeState): Snapshot {
  return new Snapshot({
    transactionMetadata: {...treeState.transactionMetadata},
    atomValues: new Map(treeState.atomValues),
    nonvalidatedAtoms: new Map(treeState.nonvalidatedAtoms),
    dirtyAtoms: new Set(treeState.dirtyAtoms),
    nodeDeps: new Map(treeState.nodeDeps),
    nodeToNodeSubscriptions: mapMap(
      treeState.nodeToNodeSubscriptions,
      keys => new Set(keys),
    ),
    nodeToComponentSubscriptions: new Map(),
  });
}

module.exports = {
  Snapshot,
  freshSnapshot,
  cloneSnapshot,
};
