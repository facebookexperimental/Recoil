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
import type {
  AtomValues,
  AtomWrites,
  NodeKey,
  Store,
  TreeState,
} from './Recoil_State';

const gkx = require('../util/Recoil_gkx');
const nullthrows = require('../util/Recoil_nullthrows');
const recoverableViolation = require('../util/Recoil_recoverableViolation');
const Tracing = require('../util/Recoil_Tracing');
const {
  getDownstreamNodes,
  getNodeLoadable,
  setNodeValue,
} = require('./Recoil_FunctionalCore');
const {saveDependencyMapToStore} = require('./Recoil_Graph');
const {getNodeMaybe} = require('./Recoil_Node');
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
  // Reading from an older tree can cause bugs because the dependencies that we
  // discover during the read are lost.
  const storeState = store.getState();
  if (
    !(
      treeState.version === storeState.currentTree.version ||
      treeState.version === storeState.nextTree?.version ||
      treeState.version === storeState.previousTree?.version
    )
  ) {
    recoverableViolation('Tried to read from a discarded tree', 'recoil');
  }

  const [dependencyMap, loadable] = getNodeLoadable(store, treeState, key);

  if (!gkx('recoil_async_selector_refactor')) {
    /**
     * In selector_NEW, we take care of updating state deps within the selector
     */
    saveDependencyMapToStore(dependencyMap, store, treeState.version);
  }

  return loadable;
}

function applyAtomValueWrites(
  atomValues: AtomValues,
  writes: AtomWrites,
): AtomValues {
  const result = atomValues.clone();
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
  state: TreeState,
  {key}: AbstractRecoilValue<T>,
  valueOrUpdater: ValueOrUpdater<T>,
): T | DefaultValue {
  if (typeof valueOrUpdater === 'function') {
    // Updater form: pass in the current value. Throw if the current value
    // is unavailable (namely when updating an async selector that's
    // pending or errored):
    // NOTE: This will evaluate node, but not update state with node subscriptions!
    const current = getNodeLoadable(store, state, key)[1];
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

type Action<T> =
  | {
      type: 'set',
      recoilValue: AbstractRecoilValue<T>,
      valueOrUpdater: T | DefaultValue | (T => T | DefaultValue),
    }
  | {
      type: 'setLoadable',
      recoilValue: AbstractRecoilValue<T>,
      loadable: Loadable<T>,
    }
  | {
      type: 'setUnvalidated',
      recoilValue: AbstractRecoilValue<T>,
      unvalidatedValue: mixed,
    }
  | {type: 'markModified', recoilValue: AbstractRecoilValue<T>};

function applyAction(store: Store, state: TreeState, action: Action<mixed>) {
  if (action.type === 'set') {
    const {recoilValue, valueOrUpdater} = action;
    const newValue = valueFromValueOrUpdater(
      store,
      state,
      recoilValue,
      valueOrUpdater,
    );
    const [depMap, writes] = setNodeValue(
      store,
      state,
      recoilValue.key,
      newValue,
    );
    saveDependencyMapToStore(depMap, store, state.version);
    for (const [key, loadable] of writes.entries()) {
      writeLoadableToTreeState(state, key, loadable);
    }
  } else if (action.type === 'setLoadable') {
    const {
      recoilValue: {key},
      loadable,
    } = action;
    writeLoadableToTreeState(state, key, loadable);
  } else if (action.type === 'markModified') {
    const {
      recoilValue: {key},
    } = action;
    state.dirtyAtoms.add(key);
  } else if (action.type === 'setUnvalidated') {
    // Write value directly to state bypassing the Node interface as the node
    // definitions may not have been loaded yet when processing the initial snapshot.
    const {
      recoilValue: {key},
      unvalidatedValue,
    } = action;
    const node = getNodeMaybe(key);
    node?.invalidate?.(state);
    state.atomValues.delete(key);
    state.nonvalidatedAtoms.set(key, unvalidatedValue);
    state.dirtyAtoms.add(key);
  } else {
    recoverableViolation(`Unknown action ${action.type}`, 'recoil');
  }
}

function writeLoadableToTreeState(
  state: TreeState,
  key: NodeKey,
  loadable: Loadable<mixed>,
): void {
  if (
    loadable.state === 'hasValue' &&
    loadable.contents instanceof DefaultValue
  ) {
    state.atomValues.delete(key);
  } else {
    state.atomValues.set(key, loadable);
  }
  state.dirtyAtoms.add(key);
  state.nonvalidatedAtoms.delete(key);
}

function applyActionsToStore(store, actions) {
  store.replaceState(state => {
    const newState = copyTreeState(state);
    for (const action of actions) {
      applyAction(store, newState, action);
    }
    invalidateDownstreams(store, newState);
    return newState;
  });
}

function queueOrPerformStateUpdate(
  store: Store,
  action: Action<mixed>,
  key: NodeKey,
  message: string,
): void {
  if (batchStack.length) {
    const actionsByStore = batchStack[batchStack.length - 1];
    let actions = actionsByStore.get(store);
    if (!actions) {
      actionsByStore.set(store, (actions = []));
    }
    actions.push(action);
  } else {
    Tracing.trace(message, key, () => applyActionsToStore(store, [action]));
  }
}

const batchStack: Array<Map<Store, Array<Action<mixed>>>> = [];
function batchStart(): () => void {
  const actionsByStore = new Map();
  batchStack.push(actionsByStore);
  return () => {
    for (const [store, actions] of actionsByStore) {
      Tracing.trace('Recoil batched updates', '-', () =>
        applyActionsToStore(store, actions),
      );
    }
    const popped = batchStack.pop();
    if (popped !== actionsByStore) {
      recoverableViolation('Incorrect order of batch popping', 'recoil');
    }
  };
}

function copyTreeState(state) {
  return {
    ...state,
    atomValues: state.atomValues.clone(),
    nonvalidatedAtoms: state.nonvalidatedAtoms.clone(),
    dirtyAtoms: new Set(state.dirtyAtoms),
  };
}

function invalidateDownstreams(store: Store, state: TreeState): void {
  // Inform any nodes that were changed or downstream of changes so that they
  // can clear out any caches as needed due to the update:
  const downstreams = getDownstreamNodes(store, state, state.dirtyAtoms);
  for (const key of downstreams) {
    getNodeMaybe(key)?.invalidate?.(state);
  }
}

function setRecoilValue<T>(
  store: Store,
  recoilValue: AbstractRecoilValue<T>,
  valueOrUpdater: T | DefaultValue | (T => T | DefaultValue),
): void {
  queueOrPerformStateUpdate(
    store,
    {
      type: 'set',
      recoilValue,
      valueOrUpdater,
    },
    recoilValue.key,
    'set Recoil value',
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
  queueOrPerformStateUpdate(
    store,
    {
      type: 'setLoadable',
      recoilValue,
      loadable,
    },
    recoilValue.key,
    'set Recoil value',
  );
}

function markRecoilValueModified<T>(
  store: Store,
  recoilValue: AbstractRecoilValue<T>,
): void {
  queueOrPerformStateUpdate(
    store,
    {
      type: 'markModified',
      recoilValue,
    },
    recoilValue.key,
    'mark RecoilValue modified',
  );
}

function setUnvalidatedRecoilValue<T>(
  store: Store,
  recoilValue: AbstractRecoilValue<T>,
  unvalidatedValue: T,
): void {
  queueOrPerformStateUpdate(
    store,
    {
      type: 'setUnvalidated',
      recoilValue,
      unvalidatedValue,
    },
    recoilValue.key,
    'set Recoil value',
  );
}

export type ComponentSubscription = {release: () => void};
let subscriptionID = 0;
function subscribeToRecoilValue<T>(
  store: Store,
  {key}: AbstractRecoilValue<T>,
  callback: TreeState => void,
  componentDebugName: ?string = null,
): ComponentSubscription {
  const subID = subscriptionID++;
  const storeState = store.getState();
  if (!storeState.nodeToComponentSubscriptions.has(key)) {
    storeState.nodeToComponentSubscriptions.set(key, new Map());
  }
  nullthrows(storeState.nodeToComponentSubscriptions.get(key)).set(subID, [
    componentDebugName ?? '<not captured>',
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
  batchStart,
  invalidateDownstreams_FOR_TESTING: invalidateDownstreams,
};
