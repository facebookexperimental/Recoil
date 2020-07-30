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
import type {DefaultValue} from '../core/Recoil_Node';
import type {PersistenceType} from '../core/Recoil_Node';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {ComponentSubscription} from '../core/Recoil_RecoilValueInterface';
import type {NodeKey, Store, TreeState} from '../core/Recoil_State';

const React = require('React');
const {useCallback, useEffect, useMemo, useRef, useState} = require('React');
const ReactDOM = require('ReactDOM');

const {DEFAULT_VALUE, getNode, nodes} = require('../core/Recoil_Node');
const {useStoreRef} = require('../core/Recoil_RecoilRoot.react');
const {isRecoilValue} = require('../core/Recoil_RecoilValue');
const {
  AbstractRecoilValue,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setRecoilValueLoadable,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
} = require('../core/Recoil_RecoilValueInterface');
const {Snapshot, cloneSnapshot} = require('../core/Recoil_Snapshot');
const {setByAddingToSet} = require('../util/Recoil_CopyOnWrite');
const differenceSets = require('../util/Recoil_differenceSets');
const expectationViolation = require('../util/Recoil_expectationViolation');
const filterMap = require('../util/Recoil_filterMap');
const filterSet = require('../util/Recoil_filterSet');
const invariant = require('../util/Recoil_invariant');
const mapMap = require('../util/Recoil_mapMap');
const mergeMaps = require('../util/Recoil_mergeMaps');
const nullthrows = require('../util/Recoil_nullthrows');
const recoverableViolation = require('../util/Recoil_recoverableViolation');
const Tracing = require('../util/Recoil_Tracing');

function handleLoadable<T>(loadable: Loadable<T>, atom, storeRef): T {
  // We can't just throw the promise we are waiting on to Suspense.  If the
  // upstream dependencies change it may produce a state in which the component
  // can render, but it would still be suspended on a Promise that may never resolve.
  if (loadable.state === 'hasValue') {
    return loadable.contents;
  } else if (loadable.state === 'loading') {
    const promise = new Promise(resolve => {
      storeRef.current.getState().suspendedComponentResolvers.add(resolve);
    });
    throw promise;
  } else if (loadable.state === 'hasError') {
    throw loadable.contents;
  } else {
    throw new Error(`Invalid value of loadable atom "${atom.key}"`);
  }
}

function validateRecoilValue(recoilValue, hookName) {
  if (!isRecoilValue(recoilValue)) {
    throw new Error(
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
  getRecoilStateLoadable<T>(RecoilState<T>): [Loadable<T>, SetterOrUpdater<T>],
  getSetRecoilState: <T>(RecoilState<T>) => SetterOrUpdater<T>,
  getResetRecoilState: <T>(RecoilState<T>) => Resetter,
};

function useRecoilInterface_DEPRECATED(): RecoilInterface {
  const storeRef = useStoreRef();
  const [_, forceUpdate] = useState([]);

  const recoilValuesUsed = useRef<Set<NodeKey>>(new Set());
  recoilValuesUsed.current = new Set(); // Track the RecoilValues used just during this render
  const previousSubscriptions = useRef<Set<NodeKey>>(new Set());
  const subscriptions = useRef<Map<NodeKey, ComponentSubscription>>(new Map());

  const unsubscribeFrom = useCallback(
    key => {
      const sub = subscriptions.current.get(key);
      if (sub) {
        sub.release(storeRef.current);
        subscriptions.current.delete(key);
      }
    },
    [storeRef, subscriptions],
  );

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
          Tracing.trace('RecoilValue subscription fired', key, () => {
            updateState(state, key);
          });
        },
      );
      subscriptions.current.set(key, sub);

      Tracing.trace('initial update on subscribing', key, () => {
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
          store.getState().queuedComponentCallbacks_DEPRECATED.push(
            Tracing.wrap(() => {
              updateState(store.getState(), key);
            }),
          );
        } else {
          updateState(store.getState(), key);
        }
      });
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
        validateRecoilValue(recoilState, 'useResetRecoilState');
      }
      return () => setRecoilValue(storeRef.current, recoilState, DEFAULT_VALUE);
    }

    function useRecoilValueLoadable<T>(
      recoilValue: RecoilValue<T>,
    ): Loadable<T> {
      if (__DEV__) {
        validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
      }
      if (!recoilValuesUsed.current.has(recoilValue.key)) {
        recoilValuesUsed.current = setByAddingToSet(
          recoilValuesUsed.current,
          recoilValue.key,
        );
      }
      // TODO Restore optimization to memoize lookup
      return getRecoilValueAsLoadable(storeRef.current, recoilValue);
    }

    function useRecoilValue<T>(recoilValue: RecoilValue<T>): T {
      if (__DEV__) {
        validateRecoilValue(recoilValue, 'useRecoilValue');
      }
      const loadable = useRecoilValueLoadable(recoilValue);
      return handleLoadable(loadable, recoilValue, storeRef);
    }

    function useRecoilState<T>(
      recoilState: RecoilState<T>,
    ): [T, SetterOrUpdater<T>] {
      if (__DEV__) {
        validateRecoilValue(recoilState, 'useRecoilState');
      }
      return [useRecoilValue(recoilState), useSetRecoilState(recoilState)];
    }

    function useRecoilStateLoadable<T>(
      recoilState: RecoilState<T>,
    ): [Loadable<T>, SetterOrUpdater<T>] {
      if (__DEV__) {
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

function useRecoilValueLoadable_MUTABLESOURCE<T>(
  recoilValue: RecoilValue<T>,
): Loadable<T> {
  if (__DEV__) {
    validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
  }
  const storeRef = useStoreRef();

  const getTreeState = useCallback(() => {
    return storeRef.current.getState().currentTree;
  }, [storeRef]);

  const subscribe = useCallback(
    (_something, callback) => {
      const store = storeRef.current;
      const sub = subscribeToRecoilValue(store, recoilValue, () => {
        Tracing.trace('RecoilValue subscription fired', recoilValue.key, () => {
          callback();
        });
      });
      return () => sub.release(store);
    },
    [recoilValue, storeRef],
  );

  const treeState = useMutableSource(
    storeRef.current.mutableSource,
    getTreeState,
    subscribe,
  );

  return getRecoilValueAsLoadable(storeRef.current, recoilValue, treeState);
}

function useRecoilValueLoadable_LEGACY<T>(
  recoilValue: RecoilValue<T>,
): Loadable<T> {
  if (__DEV__) {
    validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
  }
  const storeRef = useStoreRef();
  const [_, forceUpdate] = useState([]);

  useEffect(() => {
    const store = storeRef.current;
    const sub = subscribeToRecoilValue(store, recoilValue, _state => {
      Tracing.trace('RecoilValue subscription fired', recoilValue.key, () => {
        forceUpdate([]);
      });
    });
    Tracing.trace('initial update on subscribing', recoilValue.key, () => {
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
      const state = store.getState();
      if (state.nextTree) {
        store.getState().queuedComponentCallbacks_DEPRECATED.push(
          Tracing.wrap(() => {
            forceUpdate([]);
          }),
        );
      } else {
        forceUpdate([]);
      }
    });

    return () => sub.release(store);
  }, [recoilValue, storeRef]);

  return getRecoilValueAsLoadable(storeRef.current, recoilValue);
}

// FIXME T2710559282599660
const useMutableSource =
  (React: any).useMutableSource ?? (React: any).unstable_useMutableSource; // flowlint-line unclear-type:off

/**
  Like useRecoilValue(), but either returns the value if available or
  just undefined if not available for any reason, such as pending or error.
*/
function useRecoilValueLoadable<T>(recoilValue: RecoilValue<T>): Loadable<T> {
  if (useMutableSource) {
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
  const atomValues: Map<NodeKey, Loadable<mixed>> = state.atomValues;
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
  return mergeMaps(state.nonvalidatedAtoms, persistedAtomContentsValues);
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
    modifiedAtoms: Set<NodeKey>,
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
        const previousAtomValues = externallyVisibleAtomValuesInState(
          previousTree,
        );
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
        callback({
          snapshot: cloneSnapshot(store, 'current'),
          previousSnapshot: cloneSnapshot(store, 'previous'),
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
  useTransactionSubscription(
    useCallback(store => setSnapshot(cloneSnapshot(store)), []),
  );
  return snapshot;
}

function useGotoRecoilSnapshot(): Snapshot => void {
  const storeRef = useStoreRef();
  return useCallback(
    (snapshot: Snapshot) => {
      const storeState = storeRef.current.getState();
      const prev = storeState.nextTree ?? storeState.currentTree;
      const next = snapshot.getStore_INTERNAL().getState().currentTree;
      ReactDOM.unstable_batchedUpdates(() => {
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
    ReactDOM.unstable_batchedUpdates(() => {
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

type CallbackInterface = $ReadOnly<{
  set: <T>(RecoilState<T>, (T => T) | T) => void,
  reset: <T>(RecoilState<T>) => void,
  snapshot: Snapshot,
  gotoSnapshot: Snapshot => void,
}>;

class Sentinel {}
const SENTINEL = new Sentinel();

function useRecoilCallback<Args: $ReadOnlyArray<mixed>, Return>(
  fn: CallbackInterface => (...Args) => Return,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => Return {
  const storeRef = useStoreRef();
  const gotoSnapshot = useGotoRecoilSnapshot();

  return useCallback(
    (...args): Return => {
      // Use currentTree for the snapshot to show the currently committed state
      const snapshot = cloneSnapshot(storeRef.current);

      function set<T>(
        recoilState: RecoilState<T>,
        newValueOrUpdater: (T => T) | T,
      ) {
        setRecoilValue(storeRef.current, recoilState, newValueOrUpdater);
      }

      function reset<T>(recoilState: RecoilState<T>) {
        setRecoilValue(storeRef.current, recoilState, DEFAULT_VALUE);
      }

      let ret = SENTINEL;
      ReactDOM.unstable_batchedUpdates(() => {
        // flowlint-next-line unclear-type:off
        ret = (fn: any)({set, reset, snapshot, gotoSnapshot})(...args);
      });
      invariant(
        !(ret instanceof Sentinel),
        'unstable_batchedUpdates should return immediately',
      );
      return (ret: Return);
    },
    deps != null ? [...deps, storeRef] : undefined, // eslint-disable-line fb-www/react-hooks-deps
  );
}

function useRecoilStore() {
  return useStoreRef().current;
}

module.exports = {
  useRecoilCallback,
  useRecoilValue,
  useRecoilValueLoadable,
  useRecoilState,
  useRecoilStateLoadable,
  useSetRecoilState,
  useResetRecoilState,
  useRecoilInterface: useRecoilInterface_DEPRECATED,
  useTransactionSubscription_DEPRECATED: useTransactionSubscription,
  useTransactionObservation_DEPRECATED,
  useRecoilTransactionObserver,
  useRecoilSnapshot,
  useGotoRecoilSnapshot,
  useSetUnvalidatedAtomValues,
  useRecoilStore,
};
