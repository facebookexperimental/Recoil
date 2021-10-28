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
import type {TransactionInterface} from '../core/Recoil_AtomicUpdates';
import type {DefaultValue, PersistenceType} from '../core/Recoil_Node';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {ComponentSubscription} from '../core/Recoil_RecoilValueInterface';
import type {NodeKey, Store, TreeState} from '../core/Recoil_State';

const {atomicUpdater} = require('../core/Recoil_AtomicUpdates');
const {batchUpdates} = require('../core/Recoil_Batching');
const {DEFAULT_VALUE, getNode, nodes} = require('../core/Recoil_Node');
const {
  useRecoilMutableSource,
  useStoreRef,
} = require('../core/Recoil_RecoilRoot.react');
const {isRecoilValue} = require('../core/Recoil_RecoilValue');
const {
  AbstractRecoilValue,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setRecoilValueLoadable,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
} = require('../core/Recoil_RecoilValueInterface');
const {SUSPENSE_TIMEOUT_MS} = require('../core/Recoil_Retention');
const {Snapshot, cloneSnapshot} = require('../core/Recoil_Snapshot');
const {setByAddingToSet} = require('../util/Recoil_CopyOnWrite');
const differenceSets = require('../util/Recoil_differenceSets');
const {isSSR} = require('../util/Recoil_Environment');
const err = require('../util/Recoil_err');
const expectationViolation = require('../util/Recoil_expectationViolation');
const filterMap = require('../util/Recoil_filterMap');
const filterSet = require('../util/Recoil_filterSet');
const gkx = require('../util/Recoil_gkx');
const invariant = require('../util/Recoil_invariant');
const mapMap = require('../util/Recoil_mapMap');
const mergeMaps = require('../util/Recoil_mergeMaps');
const {
  mutableSourceExists,
  useMutableSource,
} = require('../util/Recoil_mutableSource');
const nullthrows = require('../util/Recoil_nullthrows');
const recoverableViolation = require('../util/Recoil_recoverableViolation');
const useComponentName = require('../util/Recoil_useComponentName');
const usePrevious = require('../util/Recoil_usePrevious');
const useRetain = require('./Recoil_useRetain');
const {useCallback, useEffect, useMemo, useRef, useState} = require('react');

function handleLoadable<T>(
  loadable: Loadable<T>,
  recoilValue: RecoilValue<T>,
  storeRef,
): T {
  // We can't just throw the promise we are waiting on to Suspense.  If the
  // upstream dependencies change it may produce a state in which the component
  // can render, but it would still be suspended on a Promise that may never resolve.
  if (loadable.state === 'hasValue') {
    return loadable.contents;
  } else if (loadable.state === 'loading') {
    const promise = new Promise(resolve => {
      storeRef.current.getState().suspendedComponentResolvers.add(resolve);
    });

    // $FlowFixMe Flow(prop-missing) for integrating with tools that inspect thrown promises @fb-only
    // @fb-only: promise.displayName = `Recoil State: ${recoilValue.key}`;

    throw promise;
  } else if (loadable.state === 'hasError') {
    throw loadable.contents;
  } else {
    throw err(`Invalid value of loadable atom "${recoilValue.key}"`);
  }
}

function validateRecoilValue(recoilValue, hookName) {
  if (!isRecoilValue(recoilValue)) {
    throw err(
      `Invalid argument to ${hookName}: expected an atom or selector but got ${String(
        recoilValue,
      )}`,
    );
  }
}

export type SetterOrUpdater<T> = ((T => T) | T) => void;
export type Resetter = () => void;
export type RecoilInterface = {
  getRecoilValue: <T>(RecoilValue<T>) => T,
  getRecoilValueLoadable: <T>(RecoilValue<T>) => Loadable<T>,
  getRecoilState: <T>(RecoilState<T>) => [T, SetterOrUpdater<T>],
  getRecoilStateLoadable: <T>(
    RecoilState<T>,
  ) => [Loadable<T>, SetterOrUpdater<T>],
  getSetRecoilState: <T>(RecoilState<T>) => SetterOrUpdater<T>,
  getResetRecoilState: <T>(RecoilState<T>) => Resetter,
};

/**
 * Various things are broken with useRecoilInterface, particularly concurrent mode
 * and memory management. They will not be fixed.
 * */
function useRecoilInterface_DEPRECATED(): RecoilInterface {
  const storeRef = useStoreRef();
  const [_, forceUpdate] = useState([]);

  const recoilValuesUsed = useRef<$ReadOnlySet<NodeKey>>(new Set());
  recoilValuesUsed.current = new Set(); // Track the RecoilValues used just during this render
  const previousSubscriptions = useRef<$ReadOnlySet<NodeKey>>(new Set());
  const subscriptions = useRef<Map<NodeKey, ComponentSubscription>>(new Map());

  const unsubscribeFrom = useCallback(
    key => {
      const sub = subscriptions.current.get(key);
      if (sub) {
        sub.release();
        subscriptions.current.delete(key);
      }
    },
    [subscriptions],
  );

  const componentName = useComponentName();

  useEffect(() => {
    const store = storeRef.current;

    function updateState(_state, key) {
      if (!subscriptions.current.has(key)) {
        return;
      }
      forceUpdate([]);
    }

    differenceSets(
      recoilValuesUsed.current,
      previousSubscriptions.current,
    ).forEach(key => {
      if (subscriptions.current.has(key)) {
        expectationViolation(`Double subscription to RecoilValue "${key}"`);
        return;
      }
      const sub = subscribeToRecoilValue(
        store,
        new AbstractRecoilValue(key),
        state => {
          updateState(state, key);
        },
        componentName,
      );
      subscriptions.current.set(key, sub);

      /**
       * Since we're subscribing in an effect we need to update to the latest
       * value of the atom since it may have changed since we rendered. We can
       * go ahead and do that now, unless we're in the middle of a batch --
       * in which case we should do it at the end of the batch, due to the
       * following edge case: Suppose an atom is updated in another useEffect
       * of this same component. Then the following sequence of events occur:
       * 1. Atom is updated and subs fired (but we may not be subscribed
       *    yet depending on order of effects, so we miss this) Updated value
       *    is now in nextTree, but not currentTree.
       * 2. This effect happens. We subscribe and update.
       * 3. From the update we re-render and read currentTree, with old value.
       * 4. Batcher's effect sets currentTree to nextTree.
       * In this sequence we miss the update. To avoid that, add the update
       * to queuedComponentCallback if a batch is in progress.
       */
      // FIXME delete queuedComponentCallbacks_DEPRECATED when deleting useInterface.
      const state = store.getState();
      if (state.nextTree) {
        store.getState().queuedComponentCallbacks_DEPRECATED.push(() => {
          updateState(store.getState(), key);
        });
      } else {
        updateState(store.getState(), key);
      }
    });

    differenceSets(
      previousSubscriptions.current,
      recoilValuesUsed.current,
    ).forEach(key => {
      unsubscribeFrom(key);
    });

    previousSubscriptions.current = recoilValuesUsed.current;
  });

  useEffect(() => {
    const subs = subscriptions.current;
    return () => subs.forEach((_, key) => unsubscribeFrom(key));
  }, [unsubscribeFrom]);

  return useMemo(() => {
    function useSetRecoilState<T>(
      recoilState: RecoilState<T>,
    ): SetterOrUpdater<T> {
      if (__DEV__) {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilState, 'useSetRecoilState');
      }
      return (
        newValueOrUpdater: (T => T | DefaultValue) | T | DefaultValue,
      ) => {
        setRecoilValue(storeRef.current, recoilState, newValueOrUpdater);
      };
    }

    function useResetRecoilState<T>(recoilState: RecoilState<T>): Resetter {
      if (__DEV__) {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilState, 'useResetRecoilState');
      }
      return () => setRecoilValue(storeRef.current, recoilState, DEFAULT_VALUE);
    }

    function useRecoilValueLoadable<T>(
      recoilValue: RecoilValue<T>,
    ): Loadable<T> {
      if (__DEV__) {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
      }
      if (!recoilValuesUsed.current.has(recoilValue.key)) {
        recoilValuesUsed.current = setByAddingToSet(
          recoilValuesUsed.current,
          recoilValue.key,
        );
      }
      // TODO Restore optimization to memoize lookup
      const storeState = storeRef.current.getState();
      return getRecoilValueAsLoadable(
        storeRef.current,
        recoilValue,
        gkx('recoil_early_rendering_2021')
          ? storeState.nextTree ?? storeState.currentTree
          : storeState.currentTree,
      );
    }

    function useRecoilValue<T>(recoilValue: RecoilValue<T>): T {
      if (__DEV__) {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilValue, 'useRecoilValue');
      }
      const loadable = useRecoilValueLoadable(recoilValue);
      return handleLoadable(loadable, recoilValue, storeRef);
    }

    function useRecoilState<T>(
      recoilState: RecoilState<T>,
    ): [T, SetterOrUpdater<T>] {
      if (__DEV__) {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilState, 'useRecoilState');
      }
      return [useRecoilValue(recoilState), useSetRecoilState(recoilState)];
    }

    function useRecoilStateLoadable<T>(
      recoilState: RecoilState<T>,
    ): [Loadable<T>, SetterOrUpdater<T>] {
      if (__DEV__) {
        // $FlowFixMe[escaped-generic]
        validateRecoilValue(recoilState, 'useRecoilStateLoadable');
      }
      return [
        useRecoilValueLoadable(recoilState),
        useSetRecoilState(recoilState),
      ];
    }

    return {
      getRecoilValue: useRecoilValue,
      getRecoilValueLoadable: useRecoilValueLoadable,
      getRecoilState: useRecoilState,
      getRecoilStateLoadable: useRecoilStateLoadable,
      getSetRecoilState: useSetRecoilState,
      getResetRecoilState: useResetRecoilState,
    };
  }, [recoilValuesUsed, storeRef]);
}

const recoilComponentGetRecoilValueCount_FOR_TESTING = {current: 0};

function useRecoilValueLoadable_MUTABLESOURCE<T>(
  recoilValue: RecoilValue<T>,
): Loadable<T> {
  if (__DEV__) {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
  }
  const storeRef = useStoreRef();

  const getLoadable = useCallback(() => {
    const store = storeRef.current;
    const storeState = store.getState();
    const treeState = gkx('recoil_early_rendering_2021')
      ? storeState.nextTree ?? storeState.currentTree
      : storeState.currentTree;
    return getRecoilValueAsLoadable(store, recoilValue, treeState);
  }, [storeRef, recoilValue]);
  const getLoadableWithTesting = useCallback(() => {
    if (__DEV__) {
      recoilComponentGetRecoilValueCount_FOR_TESTING.current++;
    }
    return getLoadable();
  }, [getLoadable]);

  const componentName = useComponentName();

  const subscribe = useCallback(
    (_storeState, callback) => {
      const store = storeRef.current;
      const subscription = subscribeToRecoilValue(
        store,
        recoilValue,
        () => {
          if (!gkx('recoil_suppress_rerender_in_callback')) {
            return callback();
          }
          // Only re-render if the value has changed.
          // This will evaluate the atom/selector now as well as when the
          // component renders, but that may help with prefetching.
          const newLoadable = getLoadable();
          if (!prevLoadableRef.current.is(newLoadable)) {
            callback();
          }
          // If the component is suspended then the effect setting prevLoadableRef
          // will not run.  So, set the previous value here when its subscription
          // is fired to wake it up.  We can't just rely on this, though, because
          // this only executes when an atom/selector is dirty and the atom/selector
          // passed to the hook can dynamically change.
          prevLoadableRef.current = newLoadable;
        },
        componentName,
      );
      return subscription.release;
    },
    [storeRef, recoilValue, componentName, getLoadable],
  );

  const source = useRecoilMutableSource();
  const loadable = useMutableSource(source, getLoadableWithTesting, subscribe);
  const prevLoadableRef = useRef(loadable);
  useEffect(() => {
    prevLoadableRef.current = loadable;
  });
  return loadable;
}

function useRecoilValueLoadable_LEGACY<T>(
  recoilValue: RecoilValue<T>,
): Loadable<T> {
  if (__DEV__) {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
  }
  const storeRef = useStoreRef();
  const [_, forceUpdate] = useState([]);

  const componentName = useComponentName();

  useEffect(() => {
    const store = storeRef.current;
    const storeState = store.getState();
    const subscription = subscribeToRecoilValue(
      store,
      recoilValue,
      _state => {
        if (!gkx('recoil_suppress_rerender_in_callback')) {
          return forceUpdate([]);
        }
        const newLoadable = getRecoilValueAsLoadable(
          store,
          recoilValue,
          store.getState().currentTree,
        );
        if (!prevLoadableRef.current?.is(newLoadable)) {
          forceUpdate(newLoadable);
        }
        prevLoadableRef.current = newLoadable;
      },
      componentName,
    );

    /**
     * Since we're subscribing in an effect we need to update to the latest
     * value of the atom since it may have changed since we rendered. We can
     * go ahead and do that now, unless we're in the middle of a batch --
     * in which case we should do it at the end of the batch, due to the
     * following edge case: Suppose an atom is updated in another useEffect
     * of this same component. Then the following sequence of events occur:
     * 1. Atom is updated and subs fired (but we may not be subscribed
     *    yet depending on order of effects, so we miss this) Updated value
     *    is now in nextTree, but not currentTree.
     * 2. This effect happens. We subscribe and update.
     * 3. From the update we re-render and read currentTree, with old value.
     * 4. Batcher's effect sets currentTree to nextTree.
     * In this sequence we miss the update. To avoid that, add the update
     * to queuedComponentCallback if a batch is in progress.
     */
    if (storeState.nextTree) {
      store.getState().queuedComponentCallbacks_DEPRECATED.push(() => {
        prevLoadableRef.current = null;
        forceUpdate([]);
      });
    } else {
      if (!gkx('recoil_suppress_rerender_in_callback')) {
        return forceUpdate([]);
      }
      const newLoadable = getRecoilValueAsLoadable(
        store,
        recoilValue,
        store.getState().currentTree,
      );
      if (!prevLoadableRef.current?.is(newLoadable)) {
        forceUpdate(newLoadable);
      }
      prevLoadableRef.current = newLoadable;
    }

    return subscription.release;
  }, [componentName, recoilValue, storeRef]);

  const loadable = getRecoilValueAsLoadable(storeRef.current, recoilValue);
  const prevLoadableRef = useRef(loadable);
  useEffect(() => {
    prevLoadableRef.current = loadable;
  });
  return loadable;
}

/**
  Like useRecoilValue(), but either returns the value if available or
  just undefined if not available for any reason, such as pending or error.
*/
function useRecoilValueLoadable<T>(recoilValue: RecoilValue<T>): Loadable<T> {
  if (gkx('recoil_memory_managament_2020')) {
    // eslint-disable-next-line fb-www/react-hooks
    useRetain(recoilValue);
  }
  if (mutableSourceExists()) {
    // eslint-disable-next-line fb-www/react-hooks
    return useRecoilValueLoadable_MUTABLESOURCE(recoilValue);
  } else {
    // eslint-disable-next-line fb-www/react-hooks
    return useRecoilValueLoadable_LEGACY(recoilValue);
  }
}

/**
  Returns the value represented by the RecoilValue.
  If the value is pending, it will throw a Promise to suspend the component,
  if the value is an error it will throw it for the nearest React error boundary.
  This will also subscribe the component for any updates in the value.
  */
function useRecoilValue<T>(recoilValue: RecoilValue<T>): T {
  if (__DEV__) {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilValue, 'useRecoilValue');
  }
  const storeRef = useStoreRef();
  const loadable = useRecoilValueLoadable(recoilValue);
  return handleLoadable(loadable, recoilValue, storeRef);
}

/**
  Returns a function that allows the value of a RecoilState to be updated, but does
  not subscribe the component to changes to that RecoilState.
*/
function useSetRecoilState<T>(recoilState: RecoilState<T>): SetterOrUpdater<T> {
  if (__DEV__) {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilState, 'useSetRecoilState');
  }
  const storeRef = useStoreRef();
  return useCallback(
    (newValueOrUpdater: (T => T | DefaultValue) | T | DefaultValue) => {
      setRecoilValue(storeRef.current, recoilState, newValueOrUpdater);
    },
    [storeRef, recoilState],
  );
}

/**
  Returns a function that will reset the value of a RecoilState to its default
*/
function useResetRecoilState<T>(recoilState: RecoilState<T>): Resetter {
  if (__DEV__) {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilState, 'useResetRecoilState');
  }
  const storeRef = useStoreRef();
  return useCallback(() => {
    setRecoilValue(storeRef.current, recoilState, DEFAULT_VALUE);
  }, [storeRef, recoilState]);
}

/**
  Equivalent to useState(). Allows the value of the RecoilState to be read and written.
  Subsequent updates to the RecoilState will cause the component to re-render. If the
  RecoilState is pending, this will suspend the component and initiate the
  retrieval of the value. If evaluating the RecoilState resulted in an error, this will
  throw the error so that the nearest React error boundary can catch it.
*/
function useRecoilState<T>(
  recoilState: RecoilState<T>,
): [T, SetterOrUpdater<T>] {
  if (__DEV__) {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilState, 'useRecoilState');
  }
  return [useRecoilValue(recoilState), useSetRecoilState(recoilState)];
}

/**
  Like useRecoilState(), but does not cause Suspense or React error handling. Returns
  an object that indicates whether the RecoilState is available, pending, or
  unavailable due to an error.
*/
function useRecoilStateLoadable<T>(
  recoilState: RecoilState<T>,
): [Loadable<T>, SetterOrUpdater<T>] {
  if (__DEV__) {
    // $FlowFixMe[escaped-generic]
    validateRecoilValue(recoilState, 'useRecoilStateLoadable');
  }
  return [useRecoilValueLoadable(recoilState), useSetRecoilState(recoilState)];
}

function useTransactionSubscription(callback: Store => void) {
  const storeRef = useStoreRef();
  useEffect(() => {
    const sub = storeRef.current.subscribeToTransactions(callback);
    return sub.release;
  }, [callback, storeRef]);
}

function externallyVisibleAtomValuesInState(
  state: TreeState,
): Map<NodeKey, mixed> {
  const atomValues = state.atomValues.toMap();
  const persistedAtomContentsValues = mapMap(
    filterMap(atomValues, (v, k) => {
      const node = getNode(k);
      const persistence = node.persistence_UNSTABLE;
      return (
        persistence != null &&
        persistence.type !== 'none' &&
        v.state === 'hasValue'
      );
    }),
    v => v.contents,
  );
  // Merge in nonvalidated atoms; we may not have defs for them but they will
  // all have persistence on or they wouldn't be there in the first place.
  return mergeMaps(
    state.nonvalidatedAtoms.toMap(),
    persistedAtomContentsValues,
  );
}

type ExternallyVisibleAtomInfo = {
  persistence_UNSTABLE: {
    type: PersistenceType,
    backButton: boolean,
    ...
  },
  ...
};

/**
  Calls the given callback after any atoms have been modified and the consequent
  component re-renders have been committed. This is intended for persisting
  the values of the atoms to storage. The stored values can then be restored
  using the useSetUnvalidatedAtomValues hook.

  The callback receives the following info:

  atomValues: The current value of every atom that is both persistable (persistence
              type not set to 'none') and whose value is available (not in an
              error or loading state).

  previousAtomValues: The value of every persistable and available atom before
               the transaction began.

  atomInfo: A map containing the persistence settings for each atom. Every key
            that exists in atomValues will also exist in atomInfo.

  modifiedAtoms: The set of atoms that were written to during the transaction.

  transactionMetadata: Arbitrary information that was added via the
          useSetUnvalidatedAtomValues hook. Useful for ignoring the useSetUnvalidatedAtomValues
          transaction, to avoid loops.
*/
function useTransactionObservation_DEPRECATED(
  callback: ({
    atomValues: Map<NodeKey, mixed>,
    previousAtomValues: Map<NodeKey, mixed>,
    atomInfo: Map<NodeKey, ExternallyVisibleAtomInfo>,
    modifiedAtoms: $ReadOnlySet<NodeKey>,
    transactionMetadata: {[NodeKey]: mixed, ...},
  }) => void,
) {
  useTransactionSubscription(
    useCallback(
      store => {
        let previousTree = store.getState().previousTree;
        const currentTree = store.getState().currentTree;
        if (!previousTree) {
          recoverableViolation(
            'Transaction subscribers notified without a previous tree being present -- this is a bug in Recoil',
            'recoil',
          );
          previousTree = store.getState().currentTree; // attempt to trundle on
        }

        const atomValues = externallyVisibleAtomValuesInState(currentTree);
        const previousAtomValues =
          externallyVisibleAtomValuesInState(previousTree);
        const atomInfo = mapMap(nodes, node => ({
          persistence_UNSTABLE: {
            type: node.persistence_UNSTABLE?.type ?? 'none',
            backButton: node.persistence_UNSTABLE?.backButton ?? false,
          },
        }));
        // Filter on existance in atomValues so that externally-visible rules
        // are also applied to modified atoms (specifically exclude selectors):
        const modifiedAtoms = filterSet(
          currentTree.dirtyAtoms,
          k => atomValues.has(k) || previousAtomValues.has(k),
        );

        callback({
          atomValues,
          previousAtomValues,
          atomInfo,
          modifiedAtoms,
          transactionMetadata: {...currentTree.transactionMetadata},
        });
      },
      [callback],
    ),
  );
}

function useRecoilTransactionObserver(
  callback: ({
    snapshot: Snapshot,
    previousSnapshot: Snapshot,
  }) => void,
) {
  useTransactionSubscription(
    useCallback(
      store => {
        const snapshot = cloneSnapshot(store, 'current');
        const previousSnapshot = cloneSnapshot(store, 'previous');
        callback({
          snapshot,
          previousSnapshot,
        });
      },
      [callback],
    ),
  );
}

// Return a snapshot of the current state and subscribe to all state changes
function useRecoilSnapshot(): Snapshot {
  const storeRef = useStoreRef();
  const [snapshot, setSnapshot] = useState(() =>
    cloneSnapshot(storeRef.current),
  );
  const previousSnapshot = usePrevious(snapshot);
  const timeoutID = useRef();

  useEffect(() => {
    if (timeoutID.current && !isSSR) {
      window.clearTimeout(timeoutID.current);
    }
    return snapshot.retain();
  }, [snapshot]);

  useTransactionSubscription(
    useCallback(store => setSnapshot(cloneSnapshot(store)), []),
  );

  if (previousSnapshot !== snapshot && !isSSR) {
    if (timeoutID.current) {
      previousSnapshot?.release_INTERNAL();
      window.clearTimeout(timeoutID.current);
    }
    snapshot.retain();
    timeoutID.current = window.setTimeout(() => {
      snapshot.release_INTERNAL();
      timeoutID.current = null;
    }, SUSPENSE_TIMEOUT_MS);
  }

  return snapshot;
}

function useGotoRecoilSnapshot(): Snapshot => void {
  const storeRef = useStoreRef();
  return useCallback(
    (snapshot: Snapshot) => {
      const storeState = storeRef.current.getState();
      const prev = storeState.nextTree ?? storeState.currentTree;
      const next = snapshot.getStore_INTERNAL().getState().currentTree;
      batchUpdates(() => {
        const keysToUpdate = new Set();
        for (const keys of [prev.atomValues.keys(), next.atomValues.keys()]) {
          for (const key of keys) {
            if (
              prev.atomValues.get(key)?.contents !==
                next.atomValues.get(key)?.contents &&
              getNode(key).shouldRestoreFromSnapshots
            ) {
              keysToUpdate.add(key);
            }
          }
        }
        keysToUpdate.forEach(key => {
          setRecoilValueLoadable(
            storeRef.current,
            new AbstractRecoilValue(key),
            next.atomValues.has(key)
              ? nullthrows(next.atomValues.get(key))
              : DEFAULT_VALUE,
          );
        });
        storeRef.current.replaceState(state => {
          return {
            ...state,
            stateID: snapshot.getID_INTERNAL(),
          };
        });
      });
    },
    [storeRef],
  );
}

function useSetUnvalidatedAtomValues(): (
  values: Map<NodeKey, mixed>,
  transactionMetadata?: {...},
) => void {
  const storeRef = useStoreRef();
  return (values: Map<NodeKey, mixed>, transactionMetadata: {...} = {}) => {
    batchUpdates(() => {
      storeRef.current.addTransactionMetadata(transactionMetadata);
      values.forEach((value, key) =>
        setUnvalidatedRecoilValue(
          storeRef.current,
          new AbstractRecoilValue(key),
          value,
        ),
      );
    });
  };
}

export type RecoilCallbackInterface = $ReadOnly<{
  set: <T>(RecoilState<T>, (T => T) | T) => void,
  reset: <T>(RecoilState<T>) => void,
  snapshot: Snapshot,
  gotoSnapshot: Snapshot => void,
  transact_UNSTABLE: ((TransactionInterface) => void) => void,
}>;

class Sentinel {}
const SENTINEL = new Sentinel();

function useRecoilCallback<Args: $ReadOnlyArray<mixed>, Return>(
  fn: RecoilCallbackInterface => (...Args) => Return,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => Return {
  const storeRef = useStoreRef();
  const gotoSnapshot = useGotoRecoilSnapshot();

  return useCallback(
    (...args): Return => {
      function set<T>(
        recoilState: RecoilState<T>,
        newValueOrUpdater: (T => T) | T,
      ) {
        setRecoilValue(storeRef.current, recoilState, newValueOrUpdater);
      }

      function reset<T>(recoilState: RecoilState<T>) {
        setRecoilValue(storeRef.current, recoilState, DEFAULT_VALUE);
      }

      // Use currentTree for the snapshot to show the currently committed state
      const snapshot = cloneSnapshot(storeRef.current); // FIXME massive gains from doing this lazily

      const atomicUpdate = atomicUpdater(storeRef.current);

      let ret = SENTINEL;
      batchUpdates(() => {
        const errMsg =
          'useRecoilCallback expects a function that returns a function: ' +
          'it accepts a function of the type (RecoilInterface) => T = R ' +
          'and returns a callback function T => R, where RecoilInterface is an ' +
          'object {snapshot, set, ...} and T and R are the argument and return ' +
          'types of the callback you want to create.  Please see the docs ' +
          'at recoiljs.org for details.';
        if (typeof fn !== 'function') {
          throw err(errMsg);
        }
        // flowlint-next-line unclear-type:off
        const cb = (fn: any)({
          set,
          reset,
          snapshot,
          gotoSnapshot,
          transact_UNSTABLE: atomicUpdate,
        });
        if (typeof cb !== 'function') {
          throw err(errMsg);
        }
        ret = cb(...args);
      });
      invariant(
        !(ret instanceof Sentinel),
        'batchUpdates should return immediately',
      );
      return (ret: Return);
    },
    deps != null ? [...deps, storeRef] : undefined, // eslint-disable-line fb-www/react-hooks-deps
  );
}

function useRecoilTransaction<Arguments: $ReadOnlyArray<mixed>>(
  fn: TransactionInterface => (...Arguments) => void,
  deps?: $ReadOnlyArray<mixed>,
): (...Arguments) => void {
  const storeRef = useStoreRef();
  return useMemo(
    () =>
      (...args: Arguments): void => {
        const atomicUpdate = atomicUpdater(storeRef.current);
        atomicUpdate(transactionInterface => {
          fn(transactionInterface)(...args);
        });
      },
    deps != null ? [...deps, storeRef] : undefined, // eslint-disable-line fb-www/react-hooks-deps
  );
}

module.exports = {
  recoilComponentGetRecoilValueCount_FOR_TESTING,
  useGotoRecoilSnapshot,
  useRecoilCallback,
  useRecoilInterface: useRecoilInterface_DEPRECATED,
  useRecoilSnapshot,
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilTransaction,
  useRecoilTransactionObserver,
  useRecoilValue,
  useRecoilValueLoadable,
  useResetRecoilState,
  useSetRecoilState,
  useSetUnvalidatedAtomValues,
  useTransactionObservation_DEPRECATED,
  useTransactionSubscription_DEPRECATED: useTransactionSubscription,
};
