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

import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {NodeKey, Store, TreeState} from '../core/Recoil_State';

const {loadableWithValue} = require('../adt/Recoil_Loadable');
const {getNode} = require('../core/Recoil_Node');
const {
  copyTreeState,
  getRecoilValueAsLoadable,
  invalidateDownstreams,
  writeLoadableToTreeState,
} = require('../core/Recoil_RecoilValueInterface');

export interface AtomicUpdateInterface {
  get<T>(RecoilValue<T>): T;
  set<T>(RecoilState<T>, T): void;
}

function isAtom<T>(recoilValue: RecoilValue<T>): boolean {
  return getNode(recoilValue.key).nodeType === 'atom';
}

class AtomicUpdateInterfaceImpl {
  _store: Store;
  _treeState: TreeState;
  _changes: Map<NodeKey, mixed>;

  constructor(store, treeState) {
    this._store = store;
    this._treeState = treeState;
    this._changes = new Map();
  }

  // Allow destructing
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  get = <T>(recoilValue: RecoilValue<T>): T => {
    if (this._changes.has(recoilValue.key)) {
      // $FlowFixMe[incompatible-return]
      return this._changes.get(recoilValue.key);
    }
    if (!isAtom(recoilValue)) {
      throw new Error('Reading selectors within atomicUpdate is not supported');
    }
    const loadable = getRecoilValueAsLoadable(
      this._store,
      recoilValue,
      this._treeState,
    );
    if (loadable.state === 'hasValue') {
      return loadable.contents;
    } else if (loadable.state === 'hasError') {
      throw loadable.contents;
    } else {
      throw new Error(
        `Expected Recoil atom ${recoilValue.key} to have a value, but it is in a loading state.`,
      );
    }
  };

  // Allow destructing
  // eslint-disable-next-line fb-www/extra-arrow-initializer
  set = <T>(recoilState: RecoilState<T>, value: T): void => {
    if (!isAtom(recoilState)) {
      throw new Error('Setting selectors within atomicUpdate is not supported');
    }
    this._changes.set(recoilState.key, value);
  };

  newTreeState_INTERNAL(): TreeState {
    if (this._changes.size === 0) {
      return this._treeState;
    }
    const newState = copyTreeState(this._treeState);
    for (const [k, v] of this._changes) {
      writeLoadableToTreeState(newState, k, loadableWithValue(v));
    }
    invalidateDownstreams(this._store, newState);
    return newState;
  }
}

function atomicUpdater(
  store: Store,
): ((AtomicUpdateInterface) => void) => void {
  return fn => {
    store.replaceState(treeState => {
      const changeset = new AtomicUpdateInterfaceImpl(store, treeState);
      fn(changeset);
      return changeset.newTreeState_INTERNAL();
    });
  };
}

module.exports = {atomicUpdater};
