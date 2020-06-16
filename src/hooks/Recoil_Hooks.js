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
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {ComponentSubscription} from '../core/Recoil_RecoilValueInterface';
import type {NodeKey, Store, TreeState} from '../core/Recoil_State';
import type {PersistenceType} from '../recoil_values/Recoil_atom';

const {useCallback, useEffect, useMemo, useRef, useState} = require('React');
const ReactDOM = require('ReactDOM');

const {useStoreRef} = require('../components/Recoil_RecoilRoot.react');
const {
  peekNodeLoadable,
  setNodeValue,
} = require('../core/Recoil_FunctionalCore');
const {DEFAULT_VALUE, getNode, nodes} = require('../core/Recoil_Node');
const {isRecoilValue} = require('../core/Recoil_RecoilValue');
const {
  AbstractRecoilValue,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
  valueFromValueOrUpdater,
} = require('../core/Recoil_RecoilValueInterface');
const {Snapshot, cloneSnapshot} = require('../core/Recoil_Snapshot');
const {setByAddingToSet} = require('../util/Recoil_CopyOnWrite');
const differenceSets = require('../util/Recoil_differenceSets');
const expectationViolation = require('../util/Recoil_expectationViolation');
const filterMap = require('../util/Recoil_filterMap');
const intersectSets = require('../util/Recoil_intersectSets');
const invariant = require('../util/Recoil_invariant');
const mapMap = require('../util/Recoil_mapMap');
const mergeMaps = require('../util/Recoil_mergeMaps');
const recoverableViolation = require('../util/Recoil_recoverableViolation');
const Tracing = require('../util/Recoil_Tracing');

function cloneState_DEPRECATED(state: TreeState): TreeState {
  return {
    transactionMetadata: {...state.transactionMetadata},
    atomValues: new Map(state.atomValues),
    nonvalidatedAtoms: new Map(state.nonvalidatedAtoms),
    dirtyAtoms: new Set(state.dirtyAtoms),
    nodeDeps: new Map(state.nodeDeps),
    nodeToNodeSubscriptions: mapMap(
      state.nodeToNodeSubscriptions,
      keys => new Set(keys),
    ),
    nodeToComponentSubscriptions: mapMap(
      state.nodeToComponentSubscriptions,
      subsByAtom => new Map(subsByAtom),
    ),
  };
}

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

function useInterface(): RecoilInterface {
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
        updateState(store.getState(), key);
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
        const newValue = valueFromValueOrUpdater(
          storeRef.current,
          recoilState,
          newValueOrUpdater,
        );
        setRecoilValue(storeRef.current, recoilState, newValue);
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

/**
  Returns the value represented by the RecoilValue.
  If the value is pending, it will throw a Promise to suspend the component,
  if the value is an error it will throw it for the nearest React error boundary.
  This will also subscribe the component for any updates in the value.
  */
function useRecoilValue<T>(recoilValue: RecoilValue<T>): T {
  return useInterface().getRecoilValue(recoilValue);
}

/**
  Like useRecoilValue(), but either returns the value if available or
  just undefined if not available for any reason, such as pending or error.
*/
function useRecoilValueLoadable<T>(recoilValue: RecoilValue<T>): Loadable<T> {
  return useInterface().getRecoilValueLoadable(recoilValue);
}

/**
  Returns a function that allows the value of a RecoilState to be updated, but does
  not subscribe the component to changes to that RecoilState.
*/
function useSetRecoilState<T>(recoilState: RecoilState<T>): SetterOrUpdater<T> {
  return useCallback(useInterface().getSetRecoilState(recoilState), [
    recoilState,
  ]);
}

/**
  Returns a function that will reset the value of a RecoilState to its default
*/
function useResetRecoilState<T>(recoilState: RecoilState<T>): Resetter {
  return useCallback(useInterface().getResetRecoilState(recoilState), [
    recoilState,
  ]);
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
  const recoilInterface = useInterface();
  const [value] = recoilInterface.getRecoilState(recoilState);
  const setValue = useCallback(recoilInterface.getSetRecoilState(recoilState), [
    recoilState,
  ]);
  return [value, setValue];
}

/**
  Like useRecoilState(), but does not cause Suspense or React error handling. Returns
  an object that indicates whether the RecoilState is available, pending, or
  unavailable due to an error.
*/
function useRecoilStateLoadable<T>(
  recoilState: RecoilState<T>,
): [Loadable<T>, SetterOrUpdater<T>] {
  const recoilInterface = useInterface();
  const [value] = recoilInterface.getRecoilStateLoadable(recoilState);
  const setValue = useCallback(recoilInterface.getSetRecoilState(recoilState), [
    recoilState,
  ]);
  return [value, setValue];
}

function useTransactionSubscription(callback: Store => void) {
  const storeRef = useStoreRef();
  useEffect(() => {
    const sub = storeRef.current.subscribeToTransactions(callback);
    return sub.release;
  }, [callback, storeRef]);
}

// TODO instead of force update can put snapshot into local state
function useTreeStateClone_DEPRECATED(): TreeState {
  const [_, setState] = useState(0);
  const forceUpdate = useCallback(() => setState(x => x + 1), []);
  useTransactionSubscription(forceUpdate);
  const storeRef = useStoreRef();
  return cloneState_DEPRECATED(storeRef.current.getState().currentTree);
}

type UpdatedSnapshot = {
  atomValues: Map<NodeKey, mixed>,
  updatedAtoms: Set<NodeKey>,
};

function useSnapshotWithStateChange_DEPRECATED(
  transaction: (<T>(RecoilState<T>, (T) => T) => void) => void,
): UpdatedSnapshot {
  const storeRef = useStoreRef();
  let snapshot = useTreeStateClone_DEPRECATED();
  const update = <T>({key}: RecoilState<T>, updater: T => T) => {
    [snapshot] = setNodeValue(
      storeRef.current,
      snapshot,
      key,
      peekNodeLoadable(storeRef.current, snapshot, key).map(updater),
    );
  };

  transaction(update);

  const atomValues: Map<NodeKey, mixed> = mapMap(
    snapshot.atomValues,
    v => v.contents,
  );
  // Only report atoms, not selectors
  const updatedAtoms = intersectSets(
    snapshot.dirtyAtoms,
    new Set(atomValues.keys()),
  );
  return {atomValues, updatedAtoms};
}

function externallyVisibleAtomValuesInState(
  state: TreeState,
): Map<NodeKey, mixed> {
  const atomValues: Map<NodeKey, Loadable<mixed>> = state.atomValues;
  const persistedAtomContentsValues = mapMap(
    filterMap(atomValues, (v, k) => {
      const node = getNode(k);
      const persistence = node.options?.persistence_UNSTABLE;
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
        const previousState = store.getState().currentTree;
        let nextState = store.getState().nextTree;
        if (!nextState) {
          recoverableViolation(
            'Transaction subscribers notified without a next tree being present -- this is a bug in Recoil',
            'recoil',
          );
          nextState = store.getState().currentTree; // attempt to trundle on
        }

        const atomValues = externallyVisibleAtomValuesInState(nextState);
        const previousAtomValues = externallyVisibleAtomValuesInState(
          previousState,
        );
        const atomInfo = mapMap(nodes, node => ({
          persistence_UNSTABLE: {
            type: node.options?.persistence_UNSTABLE?.type ?? 'none',
            backButton: node.options?.persistence_UNSTABLE?.backButton ?? false,
          },
        }));
        const modifiedAtoms = new Set(nextState.dirtyAtoms);

        callback({
          atomValues,
          previousAtomValues,
          atomInfo,
          modifiedAtoms,
          transactionMetadata: {...nextState.transactionMetadata},
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
        const previousState = store.getState().currentTree;
        let nextState = store.getState().nextTree;
        if (!nextState) {
          recoverableViolation(
            'Transaction subscribers notified without a next tree being present -- this is a bug in Recoil',
            'recoil',
          );
          nextState = previousState; // attempt to trundle on
        }

        callback({
          snapshot: cloneSnapshot(nextState),
          previousSnapshot: cloneSnapshot(previousState),
        });
      },
      [callback],
    ),
  );
}

// Return a snapshot of the current state and subscribe to all state changes
function useRecoilSnapshotAndSubscribe(): Snapshot {
  const store = useStoreRef();
  const [snapshot, setSnapshot] = useState(() =>
    cloneSnapshot(store.current.getState().currentTree),
  );
  useTransactionSubscription(
    useCallback(
      store =>
        setSnapshot(
          cloneSnapshot(
            store.getState().nextTree ?? store.getState().currentTree,
          ),
        ),
      [],
    ),
  );
  return snapshot;
}

function useGoToSnapshot_DEPRECATED(): UpdatedSnapshot => void {
  const storeRef = useStoreRef();
  return (snapshot: UpdatedSnapshot) => {
    ReactDOM.unstable_batchedUpdates(() => {
      snapshot.updatedAtoms.forEach(key => {
        setRecoilValue(
          storeRef.current,
          new AbstractRecoilValue(key),
          snapshot.atomValues.get(key),
        );
      });
    });
  };
}

function useGotoRecoilSnapshot(): Snapshot => void {
  const storeRef = useStoreRef();
  return useCallback(
    (snapshot: Snapshot) => {
      ReactDOM.unstable_batchedUpdates(() => {
        storeRef.current.replaceState(prevState => {
          const nextState = snapshot.getStore_INTERNAL().getState().currentTree;

          // Fire subscriptions for any atoms that changed values
          const updatedKeys = new Set();
          // Going through both seems to be more efficient than constructing a union set of keys
          for (const keys of [
            prevState.atomValues.keys(),
            nextState.atomValues.keys(),
          ]) {
            for (const key of keys) {
              if (
                prevState.atomValues.get(key)?.contents !==
                nextState.atomValues.get(key)?.contents
              ) {
                updatedKeys.add(key);
              }
            }
          }
          storeRef.current.fireNodeSubscriptions(updatedKeys, 'enqueue');

          return {
            ...nextState,
            nodeToComponentSubscriptions:
              prevState.nodeToComponentSubscriptions,
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
      // Use currentTree for the snapshot to show the currently committed stable state
      const snapshot = cloneSnapshot(storeRef.current.getState().currentTree);

      function set<T>(
        recoilState: RecoilState<T>,
        newValueOrUpdater: (T => T) | T,
      ) {
        const newValue = valueFromValueOrUpdater(
          storeRef.current,
          recoilState,
          newValueOrUpdater,
        );
        setRecoilValue(storeRef.current, recoilState, newValue);
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

module.exports = {
  useRecoilCallback,
  useRecoilValue,
  useRecoilValueLoadable,
  useRecoilState,
  useRecoilStateLoadable,
  useSetRecoilState,
  useResetRecoilState,
  useRecoilInterface: useInterface,
  useSnapshotWithStateChange_DEPRECATED,
  useTransactionSubscription_DEPRECATED: useTransactionSubscription,
  useTransactionObservation_DEPRECATED,
  useRecoilTransactionObserver,
  useRecoilSnapshotAndSubscribe,
  useGoToSnapshot_DEPRECATED,
  useGotoRecoilSnapshot,
  useSetUnvalidatedAtomValues,
};
