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
import type {ValueOrUpdater} from '../recoil_values/Recoil_selector';
import type {AtomValues, Store, TreeState} from './Recoil_State';

const {
  mapByDeletingFromMap,
  mapByDeletingMultipleFromMap,
} = require('../util/Recoil_CopyOnWrite');
const mapMap = require('../util/Recoil_mapMap');
const nullthrows = require('../util/Recoil_nullthrows');
const recoverableViolation = require('../util/Recoil_recoverableViolation');
const Tracing = require('../util/Recoil_Tracing');
const unionSets = require('../util/Recoil_unionSets');
const {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
  setUnvalidatedAtomValue,
} = require('./Recoil_FunctionalCore');
const {saveDependencyMapToStore} = require('./Recoil_Graph');
const {DefaultValue, RecoilValueNotReady} = require('./Recoil_Node');
const {
  AbstractRecoilValue,
  RecoilState,
  RecoilValueReadOnly,
  isRecoilValue,
} = require('./Recoil_RecoilValue');

function getRecoilValueAsLoadable<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
  treeState: TreeState = store.getState().currentTree,
): Loadable<T> {
  const [dependencyMap, loadable] = getNodeLoadable(store, treeState, key);
  saveDependencyMapToStore(dependencyMap, store, treeState.version);
  return loadable;
}

function applyAtomValueWrites(
  atomValues: AtomValues,
  writes: AtomValues,
): AtomValues {
  const result = mapMap(atomValues, v => v);
  writes.forEach((v, k) => {
    if (v.state === 'hasValue' && v.contents instanceof DefaultValue) {
      result.delete(k);
    } else {
      result.set(k, v);
    }
  });
  return result;
}

function valueFromValueOrUpdater<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
  valueOrUpdater: ValueOrUpdater<T>,
): T | DefaultValue {
  if (typeof valueOrUpdater === 'function') {
    // Updater form: pass in the current value. Throw if the current value
    // is unavailable (namely when updating an async selector that's
    // pending or errored):
    const storeState = store.getState();
    const state = storeState.nextTree ?? storeState.currentTree;
    // NOTE: This will not update state with node subscriptions.
    const current = peekNodeLoadable(store, state, key);
    if (current.state === 'loading') {
      throw new RecoilValueNotReady(key);
    } else if (current.state === 'hasError') {
      throw current.contents;
    }
    // T itself may be a function, so our refinement is not sufficient:
    return (valueOrUpdater: any)(current.contents); // flowlint-line unclear-type:off
  } else {
    return valueOrUpdater;
  }
}

function setRecoilValue<T>(
  store: Store,
  recoilValue: AbstractRecoilValue<T>,
  valueOrUpdater: T | DefaultValue | (T => T | DefaultValue),
): void {
  const {key} = recoilValue;
  Tracing.trace('set RecoilValue', key, () =>
    store.replaceState(
      Tracing.wrap(state => {
        const newValue = valueFromValueOrUpdater(
          store,
          recoilValue,
          valueOrUpdater,
        );

        const [depMap, writes] = setNodeValue(store, state, key, newValue);
        const writtenNodes = new Set(writes.keys());

        saveDependencyMapToStore(depMap, store, state.version);

        return {
          ...state,
          dirtyAtoms: unionSets(state.dirtyAtoms, writtenNodes),
          atomValues: applyAtomValueWrites(state.atomValues, writes),
          nonvalidatedAtoms: mapByDeletingMultipleFromMap(
            state.nonvalidatedAtoms,
            writtenNodes,
          ),
        };
      }),
    ),
  );
}

function setRecoilValueLoadable<T>(
  store: Store,
  recoilValue: AbstractRecoilValue<T>,
  loadable: DefaultValue | Loadable<T>,
): void {
  if (loadable instanceof DefaultValue) {
    return setRecoilValue(store, recoilValue, loadable);
  }
  const {key} = recoilValue;
  Tracing.trace('set RecoilValue', key, () =>
    store.replaceState(
      Tracing.wrap(state => {
        const writtenNode = new Set([key]);

        return {
          ...state,
          dirtyAtoms: unionSets(state.dirtyAtoms, writtenNode),
          atomValues: applyAtomValueWrites(
            state.atomValues,
            new Map([[key, loadable]]),
          ),
          nonvalidatedAtoms: mapByDeletingFromMap(state.nonvalidatedAtoms, key),
        };
      }),
    ),
  );
}

function markRecoilValueModified<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
): void {
  Tracing.trace('mark RecoilValue modified', key, () =>
    store.replaceState(
      Tracing.wrap(state => ({
        ...state,
        dirtyAtoms: unionSets(state.dirtyAtoms, new Set([key])),
      })),
    ),
  );
}

function setUnvalidatedRecoilValue<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
  newValue: T,
): void {
  Tracing.trace('set unvalidated persisted atom', key, () =>
    store.replaceState(
      Tracing.wrap(state => {
        const newState = setUnvalidatedAtomValue(state, key, newValue);
        return newState;
      }),
    ),
  );
}

export type ComponentSubscription = {release: Store => void};
let subscriptionID = 0;
function subscribeToRecoilValue<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
  callback: TreeState => void,
): ComponentSubscription {
  const subID = subscriptionID++;
  const storeState = store.getState();
  if (!storeState.nodeToComponentSubscriptions.has(key)) {
    storeState.nodeToComponentSubscriptions.set(key, new Map());
  }
  nullthrows(storeState.nodeToComponentSubscriptions.get(key)).set(subID, [
    'TODO debug name',
    callback,
  ]);

  return {
    release: () => {
      const storeState = store.getState();
      const subs = storeState.nodeToComponentSubscriptions.get(key);
      if (subs === undefined || !subs.has(subID)) {
        recoverableViolation(
          `Subscription missing at release time for atom ${key}. This is a bug in Recoil.`,
          'recoil',
        );
        return;
      }
      subs.delete(subID);
      if (subs.size === 0) {
        storeState.nodeToComponentSubscriptions.delete(key);
      }
    },
  };
}

module.exports = {
  RecoilValueReadOnly,
  AbstractRecoilValue,
  RecoilState,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setRecoilValueLoadable,
  markRecoilValueModified,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
  isRecoilValue,
  applyAtomValueWrites, // TODO Remove export when deprecating initialStoreState_DEPRECATED in RecoilRoot
};
