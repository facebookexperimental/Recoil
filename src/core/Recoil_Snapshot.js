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
import type {Store} from './Recoil_State';

const {getRecoilValueAsLoadable} = require('./Recoil_RecoilValueInterface');
const {makeEmptyStoreState} = require('./Recoil_State');
const gkx = require('gkx');

function makeStore(): Store {
  const storeState = makeEmptyStoreState();
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

  constructor(store: Store) {
    this._store = store;
  }

  getLoadable<T>(recoilValue: RecoilValue<T>): Loadable<T> {
    return getRecoilValueAsLoadable(this._store, recoilValue);
  }

  getPromise<T>(recoilValue: RecoilValue<T>): Promise<T> {
    if (gkx('recoil_async_selector_refactor')) {
      return this.getLoadable(recoilValue)
        .toPromise()
        .then(({value}) => value);
    } else {
      return (this.getLoadable(recoilValue).toPromise(): $FlowFixMe);
    }
  }
}

function makeSnapshot(): Snapshot {
  return new Snapshot(makeStore());
}

module.exports = {
  Snapshot,
  makeSnapshot,
};
