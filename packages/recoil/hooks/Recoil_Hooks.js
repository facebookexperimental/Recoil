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
import type {NodeKey} from '../core/Recoil_State';

import {batchUpdates} from '../core/Recoil_Batching';
import {DEFAULT_VALUE} from '../core/Recoil_Node';
import {
  reactMode,
  useMutableSource,
  useSyncExternalStore,
} from '../core/Recoil_ReactMode';
import {useRecoilMutableSource, useStoreRef} from '../core/Recoil_RecoilRoot';
import {isRecoilValue} from '../core/Recoil_RecoilValue';
import {
  AbstractRecoilValue,
  getRecoilValueAsLoadable,
  setRecoilValue,
  setUnvalidatedRecoilValue,
  subscribeToRecoilValue,
} from '../core/Recoil_RecoilValueInterface';
import useRetain from './Recoil_useRetain';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {setByAddingToSet} from 'recoil-shared/util/Recoil_CopyOnWrite';
import differenceSets from 'recoil-shared/util/Recoil_differenceSets';
import err from 'recoil-shared/util/Recoil_err';
import expectationViolation from 'recoil-shared/util/Recoil_expectationViolation';
import gkx from 'recoil-shared/util/Recoil_gkx';
import useComponentName from 'recoil-shared/util/Recoil_useComponentName';

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

function validateRecoilValue<T>(recoilValue: RecoilValue<T>, hookName) {
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
 * Various things are broken with useRecoilInterface, particularly concurrent
 * mode, React strict mode, and memory management. They will not be fixed.
 * */
export function useRecoilInterface_DEPRECATED(): RecoilInterface {
  const componentName = useComponentName();
  const storeRef = useStoreRef();
  const [, forceUpdate] = useState([]);

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

  const updateState = useCallback((_state, key) => {
    if (subscriptions.current.has(key)) {
      forceUpdate([]);
    }
  }, []);

  // Effect to add/remove subscriptions as nodes are used
  useEffect(() => {
    const store = storeRef.current;

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
        state => updateState(state, key),
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

  // Effect to unsubscribe from all when unmounting
  useEffect(() => {
    const currentSubscriptions = subscriptions.current;

    // Restore subscriptions that were cleared due to StrictMode running this effect twice
    differenceSets(
      recoilValuesUsed.current,
      new Set(currentSubscriptions.keys()),
    ).forEach(key => {
      const sub = subscribeToRecoilValue(
        storeRef.current,
        new AbstractRecoilValue(key),
        state => updateState(state, key),
        componentName,
      );
      currentSubscriptions.set(key, sub);
    });

    return () => currentSubscriptions.forEach((_, key) => unsubscribeFrom(key));
  }, [componentName, storeRef, unsubscribeFrom, updateState]);

  return useMemo(() => {
    // eslint-disable-next-line no-shadow
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

    // eslint-disable-next-line no-shadow
    function useResetRecoilState<T>(recoilState: RecoilState<T>): Resetter {
      if (__DEV__) {
        validateRecoilValue(recoilState, 'useResetRecoilState');
      }
      return () => setRecoilValue(storeRef.current, recoilState, DEFAULT_VALUE);
    }

    // eslint-disable-next-line no-shadow
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
      const storeState = storeRef.current.getState();
      return getRecoilValueAsLoadable(
        storeRef.current,
        recoilValue,
        reactMode().early
          ? storeState.nextTree ?? storeState.currentTree
          : storeState.currentTree,
      );
    }

    // eslint-disable-next-line no-shadow
    function useRecoilValue<T>(recoilValue: RecoilValue<T>): T {
      if (__DEV__) {
        validateRecoilValue(recoilValue, 'useRecoilValue');
      }
      const loadable = useRecoilValueLoadable(recoilValue);
      return handleLoadable(loadable, recoilValue, storeRef);
    }

    // eslint-disable-next-line no-shadow
    function useRecoilState<T>(
      recoilState: RecoilState<T>,
    ): [T, SetterOrUpdater<T>] {
      if (__DEV__) {
        validateRecoilValue(recoilState, 'useRecoilState');
      }
      return [useRecoilValue(recoilState), useSetRecoilState(recoilState)];
    }

    // eslint-disable-next-line no-shadow
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

export const recoilComponentGetRecoilValueCount_FOR_TESTING = {current: 0};

function useRecoilValueLoadable_SYNC_EXTERNAL_STORE<T>(
  recoilValue: RecoilValue<T>,
): Loadable<T> {
  const storeRef = useStoreRef();
  const componentName = useComponentName();

  const getSnapshot = useCallback(() => {
    if (__DEV__) {
      recoilComponentGetRecoilValueCount_FOR_TESTING.current++;
    }
    const store = storeRef.current;
    const storeState = store.getState();
    const treeState = reactMode().early
      ? storeState.nextTree ?? storeState.currentTree
      : storeState.currentTree;
    const loadable = getRecoilValueAsLoadable(store, recoilValue, treeState);
    return {loadable, key: recoilValue.key};
  }, [storeRef, recoilValue]);

  // Memoize the state to avoid unnecessary rerenders
  const memoizePreviousSnapshot = useCallback(getState => {
    let prevState;
    return () => {
      const nextState = getState();
      if (
        prevState?.loadable.is(nextState.loadable) &&
        prevState?.key === nextState.key
      ) {
        return prevState;
      }
      prevState = nextState;
      return nextState;
    };
  }, []);
  const getMemoizedSnapshot = useMemo(
    () => memoizePreviousSnapshot(getSnapshot),
    [getSnapshot, memoizePreviousSnapshot],
  );

  const subscribe = useCallback(
    notify => {
      const store = storeRef.current;
      const subscription = subscribeToRecoilValue(
        store,
        recoilValue,
        notify,
        componentName,
      );
      return subscription.release;
    },
    [storeRef, recoilValue, componentName],
  );

  return useSyncExternalStore(
    subscribe,
    getMemoizedSnapshot, // getSnapshot()
    getMemoizedSnapshot, // getServerSnapshot() for SSR support
  ).loadable;
}

function useRecoilValueLoadable_MUTABLE_SOURCE<T>(
  recoilValue: RecoilValue<T>,
): Loadable<T> {
  const storeRef = useStoreRef();

  const getLoadable = useCallback(() => {
    const store = storeRef.current;
    const storeState = store.getState();
    const treeState = reactMode().early
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
    (_storeState, notify) => {
      const store = storeRef.current;
      const subscription = subscribeToRecoilValue(
        store,
        recoilValue,
        () => {
          if (!gkx('recoil_suppress_rerender_in_callback')) {
            return notify();
          }
          // Only re-render if the value has changed.
          // This will evaluate the atom/selector now as well as when the
          // component renders, but that may help with prefetching.
          const newLoadable = getLoadable();
          if (!prevLoadableRef.current.is(newLoadable)) {
            notify();
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
  if (source == null) {
    throw err(
      'Recoil hooks must be used in components contained within a <RecoilRoot> component.',
    );
  }
  const loadable = useMutableSource(source, getLoadableWithTesting, subscribe);
  const prevLoadableRef = useRef(loadable);
  useEffect(() => {
    prevLoadableRef.current = loadable;
  });
  return loadable;
}

// NOTE: This mode currently fails due to Suspense not executing effects when a
// component is suspended.  If we suspend we won't subscribe to the new atom
// even if the atom we use changes and the component is rerendered.  It will
// still have the previous pending value causing it to just suspend again and
// get stuck.  The LEGACY mode solves this by always getting the current value
// from the Recoil store, but that causes tearing and doesn't work with
// useTransition()
function useRecoilValueLoadable_CONCURRENT_LEGACY<T>(
  recoilValue: RecoilValue<T>,
): Loadable<T> {
  const storeRef = useStoreRef();
  const componentName = useComponentName();

  const getLoadable = useCallback(() => {
    if (__DEV__) {
      recoilComponentGetRecoilValueCount_FOR_TESTING.current++;
    }
    const store = storeRef.current;
    const storeState = store.getState();
    const treeState = reactMode().early
      ? storeState.nextTree ?? storeState.currentTree
      : storeState.currentTree;
    return getRecoilValueAsLoadable(store, recoilValue, treeState);
  }, [storeRef, recoilValue]);
  const getState = useCallback(
    () => ({loadable: getLoadable(), key: recoilValue.key}),
    [getLoadable, recoilValue.key],
  );

  const updateState = useCallback(
    prevState => {
      const nextState = getState();
      return prevState.loadable.is(nextState.loadable) &&
        prevState.key === nextState.key
        ? prevState
        : nextState;
    },
    [getState],
  );

  useEffect(() => {
    const subscription = subscribeToRecoilValue(
      storeRef.current,
      recoilValue,
      _state => {
        setState(updateState);
      },
      componentName,
    );

    setState(updateState);

    return subscription.release;
  }, [componentName, recoilValue, storeRef, updateState]);

  const [{loadable}, setState] = useState(getState);
  return loadable;
}

function useRecoilValueLoadable_LEGACY<T>(
  recoilValue: RecoilValue<T>,
): Loadable<T> {
  const storeRef = useStoreRef();
  const [, forceUpdate] = useState([]);
  const componentName = useComponentName();

  const getLoadable = useCallback(() => {
    if (__DEV__) {
      recoilComponentGetRecoilValueCount_FOR_TESTING.current++;
    }
    const store = storeRef.current;
    const storeState = store.getState();
    const treeState = reactMode().early
      ? storeState.nextTree ?? storeState.currentTree
      : storeState.currentTree;
    return getRecoilValueAsLoadable(store, recoilValue, treeState);
  }, [storeRef, recoilValue]);

  const loadable = getLoadable();
  const prevLoadableRef = useRef(loadable);
  useEffect(() => {
    prevLoadableRef.current = loadable;
  });

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
        const newLoadable = getLoadable();
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
      const newLoadable = getLoadable();
      if (!prevLoadableRef.current?.is(newLoadable)) {
        forceUpdate(newLoadable);
      }
      prevLoadableRef.current = newLoadable;
    }

    return subscription.release;
  }, [componentName, getLoadable, recoilValue, storeRef]);

  return loadable;
}

/**
  Like useRecoilValue(), but either returns the value if available or
  just undefined if not available for any reason, such as pending or error.
*/
export function useRecoilValueLoadable<T>(
  recoilValue: RecoilValue<T>,
): Loadable<T> {
  if (__DEV__) {
    validateRecoilValue(recoilValue, 'useRecoilValueLoadable');
  }
  if (gkx('recoil_memory_managament_2020')) {
    // eslint-disable-next-line fb-www/react-hooks
    useRetain(recoilValue);
  }
  return {
    CONCURRENT_LEGACY: useRecoilValueLoadable_CONCURRENT_LEGACY,
    SYNC_EXTERNAL_STORE: useRecoilValueLoadable_SYNC_EXTERNAL_STORE,
    MUTABLE_SOURCE: useRecoilValueLoadable_MUTABLE_SOURCE,
    LEGACY: useRecoilValueLoadable_LEGACY,
  }[reactMode().mode](recoilValue);
}

/**
  Returns the value represented by the RecoilValue.
  If the value is pending, it will throw a Promise to suspend the component,
  if the value is an error it will throw it for the nearest React error boundary.
  This will also subscribe the component for any updates in the value.
  */
export function useRecoilValue<T>(recoilValue: RecoilValue<T>): T {
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
export function useSetRecoilState<T>(
  recoilState: RecoilState<T>,
): SetterOrUpdater<T> {
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
export function useResetRecoilState<T>(recoilState: RecoilState<T>): Resetter {
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
export function useRecoilState<T>(
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
export function useRecoilStateLoadable<T>(
  recoilState: RecoilState<T>,
): [Loadable<T>, SetterOrUpdater<T>] {
  if (__DEV__) {
    validateRecoilValue(recoilState, 'useRecoilStateLoadable');
  }
  return [useRecoilValueLoadable(recoilState), useSetRecoilState(recoilState)];
}

export function useSetUnvalidatedAtomValues(): (
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
