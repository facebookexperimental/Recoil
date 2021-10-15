/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Return an atom whose state cannot vary independently but is derived from that
 * of other atoms. Whenever its dependency atoms change, it will re-evaluate
 * a function and pass along the result to any components or further selectors:
 *
 *    const exampleSelector = selector({
 *      key: 'example',
 *      get: ({get}) => {
 *        const a = get(atomA);
 *        const b = get(atomB);
 *        return a + b;
 *      },
 *    });
 *
 * In this example, the value of exampleSelector will be the sum of atomA and atomB.
 * This sum will be updated whenever either atomA or atomB changes. The value
 * returned by the function will be deeply frozen.
 *
 * The function is only reevaluated if the dependencies change and the selector
 * has a component subscribed to it (either directly or indirectly via other
 * selectors). By default, function results are cached, so if the same values
 * of the dependencies are seen again, the cached value will be returned instead
 * of the function being reevaluated. The caching behavior can be overridden
 * by providing the `cacheImplementation` option; this can be used to discard
 * old values or to provide different equality semantics.
 *
 * If the provided function returns a Promise, it will cause the value of the
 * atom to become unavailable until the promise resolves. This means that any
 * components subscribed to the selector will suspend. If the promise is rejected,
 * any subscribed components will throw the rejecting error during rendering.
 *
 * You can provide the `set` option to allow writing to the selector. This
 * should be used sparingly; maintain a conceptual separation between independent
 * state and derived values. The `set` function receives a function to set
 * upstream RecoilValues which can accept a value or an updater function.
 * The updater function provides parameters with the old value of the RecoilValue
 * as well as a get() function to read other RecoilValues.
 *
 *   const multiplierSelector = selector({
 *     key: 'multiplier',
 *     get: ({get}) => get(atomA) * 100,
 *     set: ({set, reset, get}, newValue) => set(atomA, newValue / 100),
 *   });
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from '../adt/Recoil_Loadable';
import type {CachePolicy} from '../caches/Recoil_CachePolicy';
import type {
  NodeCacheRoute,
  TreeCacheImplementation,
} from '../caches/Recoil_TreeCacheImplementationType';
import type {DefaultValue} from '../core/Recoil_Node';
import type {
  RecoilState,
  RecoilValue,
  RecoilValueReadOnly,
} from '../core/Recoil_RecoilValue';
import type {RetainedBy} from '../core/Recoil_RetainedBy';
import type {Snapshot} from '../core/Recoil_Snapshot';
import type {AtomWrites, NodeKey, Store, TreeState} from '../core/Recoil_State';
import type {
  GetRecoilValue,
  ResetRecoilState,
  SetRecoilState,
} from './Recoil_callbackTypes';

const {
  Canceled,
  CANCELED,
  loadableWithError,
  loadableWithPromise,
  loadableWithValue,
} = require('../adt/Recoil_Loadable');
const treeCacheFromPolicy = require('../caches/Recoil_treeCacheFromPolicy');
const {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
} = require('../core/Recoil_FunctionalCore');
const {saveDependencyMapToStore} = require('../core/Recoil_Graph');
const {
  DEFAULT_VALUE,
  RecoilValueNotReady,
  getConfigDeletionHandler,
  registerNode,
} = require('../core/Recoil_Node');
const {isRecoilValue} = require('../core/Recoil_RecoilValue');
const {AbstractRecoilValue} = require('../core/Recoil_RecoilValue');
const {setRecoilValueLoadable} = require('../core/Recoil_RecoilValueInterface');
const {retainedByOptionWithDefault} = require('../core/Recoil_Retention');
const {cloneSnapshot} = require('../core/Recoil_Snapshot');
const deepFreezeValue = require('../util/Recoil_deepFreezeValue');
const gkx = require('../util/Recoil_gkx');
const invariant = require('../util/Recoil_invariant');
const isPromise = require('../util/Recoil_isPromise');
const nullthrows = require('../util/Recoil_nullthrows');
const {startPerfBlock} = require('../util/Recoil_PerformanceTimings');
const recoverableViolation = require('../util/Recoil_recoverableViolation');

export type GetCallback = <Args: $ReadOnlyArray<mixed>, Return>(
  fn: ($ReadOnly<{snapshot: Snapshot}>) => (...Args) => Return,
) => (...Args) => Return;

type ReadOnlySelectorOptions<T> = $ReadOnly<{
  key: string,
  get: ({get: GetRecoilValue, getCallback: GetCallback}) =>
    | Promise<T>
    | RecoilValue<T>
    | T,

  dangerouslyAllowMutability?: boolean,

  retainedBy_UNSTABLE?: RetainedBy,
  cachePolicy_UNSTABLE?: CachePolicy,
}>;

type ReadWriteSelectorOptions<T> = $ReadOnly<{
  ...ReadOnlySelectorOptions<T>,
  set: (
    {set: SetRecoilState, get: GetRecoilValue, reset: ResetRecoilState},
    newValue: T | DefaultValue,
  ) => void,
}>;

export type DepValues = Map<NodeKey, Loadable<mixed>>;

/**
 * An ExecutionId is an arbitrary ID that lets us distinguish executions from
 * each other. This is necessary as we need a way of solving this problem:
 * "given 3 async executions, only update state for the 'latest' execution when
 * it finishes running regardless of when the other 2 finish". ExecutionIds
 * provide a convenient way of identifying executions so that we can track and
 * manage them over time.
 */
type ExecutionId = number;

/**
 * ExecutionInfo is useful for managing async work and resolving race
 * conditions. It keeps track of the following:
 *
 * 1. The dep values found so far for the latest running execution. This is
 *    useful for answering the question "given a new state, have any of the
 *    async execution's discovered dep values changed?"
 * 2. The latest loadable, which holds the loadable of the latest execution.
 *    This is important because we need to return this loadable when the
 *    selector's result is requested and there is a pending async execution. We
 *    are essentially caching the latest loading loadable without using the
 *    actual selector cache so that we can avoid creating cache keys that use
 *    partial dependencies (we never want to cache based on partial
 *    dependencies).
 * 3. The latest execution ID, which is needed to know whether or not an async
 *    execution is stale. At any point in time there may be any number of stale
 *    executions running, but there is only one 'latest' execution, which
 *    represents the execution that will make its way to the UI and make updates
 *    to global state when it finishes.
 */
type ExecutionInfo<T> = {
  depValuesDiscoveredSoFarDuringAsyncWork: ?DepValues,
  latestLoadable: ?Loadable<T>,
  latestExecutionId: ?ExecutionId,
  stateVersion: ?number,
};

// An object to hold the current state for loading dependencies for a particular
// execution of a selector.  This is used for async selector handling to know
// which dependency was pending or if a user-promise was thrown.  An object is
// used instead of just a variable with the loadingDepKey so that if the
// selector is async we can still access the current state in a promise chain
// by updating the object reference.
type LoadingDepsState = {
  loadingDepKey: NodeKey | null,
  loadingDepPromise: Promise<mixed> | null,
};

const dependencyStack = []; // for detecting circular dependencies.
const waitingStores: Map<ExecutionId, Set<Store>> = new Map();

/* eslint-disable no-redeclare */
declare function selector<T>(
  options: ReadOnlySelectorOptions<T>,
): RecoilValueReadOnly<T>;
declare function selector<T>(
  options: ReadWriteSelectorOptions<T>,
): RecoilState<T>;

const getNewExecutionId: () => ExecutionId = (() => {
  let executionId = 0;
  return () => executionId++;
})();

function getInitialExecutionInfo<T>(): ExecutionInfo<T> {
  return {
    depValuesDiscoveredSoFarDuringAsyncWork: null,
    latestLoadable: null,
    latestExecutionId: null,
    stateVersion: null,
  };
}

function selector<T>(
  options: ReadOnlySelectorOptions<T> | ReadWriteSelectorOptions<T>,
): RecoilValue<T> {
  const {key, get, cachePolicy_UNSTABLE: cachePolicy} = options;
  const set = options.set != null ? options.set : undefined; // flow

  const cache: TreeCacheImplementation<Loadable<T>> = treeCacheFromPolicy(
    cachePolicy ?? {
      equality: 'reference',
      eviction: 'keep-all',
    },
  );

  const retainedBy = retainedByOptionWithDefault(options.retainedBy_UNSTABLE);

  const executionInfoMap: Map<Store, ExecutionInfo<T>> = new Map();
  let liveStoresCount = 0;

  function selectorIsLive() {
    return !gkx('recoil_memory_managament_2020') || liveStoresCount > 0;
  }

  function getExecutionInfo(store: Store): ExecutionInfo<T> {
    if (!executionInfoMap.has(store)) {
      executionInfoMap.set(store, getInitialExecutionInfo());
    }

    return nullthrows(executionInfoMap.get(store));
  }

  function selectorInit(store: Store): () => void {
    liveStoresCount++;
    store.getState().knownSelectors.add(key); // FIXME remove knownSelectors?
    return () => {
      liveStoresCount--;
      store.getState().knownSelectors.delete(key);
      executionInfoMap.delete(store);
    };
  }

  function selectorShouldDeleteConfigOnRelease() {
    return getConfigDeletionHandler(key) !== undefined && !selectorIsLive();
  }

  function notifyStoreWhenAsyncSettles(
    store: Store,
    loadable: Loadable<T>,
    executionId: ExecutionId,
  ): void {
    if (loadable.state === 'loading') {
      let stores = waitingStores.get(executionId);

      if (stores == null) {
        waitingStores.set(executionId, (stores = new Set()));
      }

      stores.add(store);
    }
  }

  function notifyStoresOfSettledAsync(
    newLoadable: Loadable<T>,
    executionId: ExecutionId,
  ): void {
    const stores = waitingStores.get(executionId);

    if (stores !== undefined) {
      for (const store of stores) {
        setRecoilValueLoadable(
          store,
          new AbstractRecoilValue(key),
          newLoadable,
        );
      }

      waitingStores.delete(executionId);
    }
  }

  function getCachedNodeLoadable<TT>(
    store: Store,
    state: TreeState,
    nodeKey: NodeKey,
  ): Loadable<TT> {
    const isKeyPointingToSelector = store
      .getState()
      .knownSelectors.has(nodeKey);

    /**
     * It's important that we don't bypass calling getNodeLoadable for atoms
     * as getNodeLoadable has side effects in state
     */
    if (isKeyPointingToSelector && state.atomValues.has(nodeKey)) {
      return nullthrows(state.atomValues.get(nodeKey));
    }

    const loadable = getNodeLoadable(store, state, nodeKey);

    if (loadable.state !== 'loading' && isKeyPointingToSelector) {
      state.atomValues.set(nodeKey, loadable);
    }

    return loadable;
  }

  /**
   * This function attaches a then() and a catch() to a promise that was
   * returned from a selector's get() (either explicitly or implicitly by
   * running a function that uses the "async" keyword). If a selector's get()
   * returns a promise, we have two possibilities:
   *
   * 1. The promise will resolve, in which case it will have completely finished
   *    executing without any remaining pending dependencies. No more retries
   *    are needed and we can proceed with updating the cache and notifying
   *    subscribers (if it is the latest execution, otherwise only the cache
   *    will be updated and subscriptions will not be fired). This is the case
   *    handled by the attached then() handler.
   *
   * 2. The promise will throw because it either has an error or it came across
   *    an async dependency that has not yet resolved, in which case we will
   *    call wrapDepdencyPromise(), whose responsibility is to handle dependency
   *    promises. This case is handled by the attached catch() handler.
   *
   * Both branches will eventually resolve to the final result of the selector
   * (or an error if a real error occurred).
   *
   * The execution will run to completion even if it is stale, and its value
   * will be cached. But stale executions will not update global state or update
   * executionInfo as that is the responsibility of the 'latest' execution.
   *
   * Note this function should not be passed a promise that was thrown--AKA a
   * dependency promise. Dependency promises should be passed to
   * wrapPendingDependencyPromise()).
   */
  function wrapPendingPromise(
    store: Store,
    promise: Promise<T>,
    state: TreeState,
    depValues: DepValues,
    executionId: ExecutionId,
    loadingDepsState: LoadingDepsState,
  ): Promise<T | Canceled> {
    return promise
      .then(value => {
        if (!selectorIsLive()) {
          // The selector was released since the request began; ignore the response.
          clearExecutionInfo(store, executionId);
          return CANCELED;
        }

        const loadable = loadableWithValue(value);

        maybeFreezeValue(value);
        setCache(state, depValuesToDepRoute(depValues), loadable);
        setDepsInStore(store, state, new Set(depValues.keys()), executionId);

        setLoadableInStoreToNotifyDeps(store, loadable, executionId);

        return value;
      })
      .catch(errorOrPromise => {
        if (!selectorIsLive()) {
          // The selector was released since the request began; ignore the response.
          clearExecutionInfo(store, executionId);
          return CANCELED;
        }

        if (isLatestExecution(store, executionId)) {
          updateExecutionInfoDepValues(depValues, store, executionId);
        }

        if (isPromise(errorOrPromise)) {
          return wrapPendingDependencyPromise(
            store,
            errorOrPromise,
            state,
            depValues,
            executionId,
            loadingDepsState,
          );
        }

        const loadable = loadableWithError(errorOrPromise);

        maybeFreezeValue(errorOrPromise);
        setCache(state, depValuesToDepRoute(depValues), loadable);
        setDepsInStore(store, state, new Set(depValues.keys()), executionId);

        setLoadableInStoreToNotifyDeps(store, loadable, executionId);

        throw errorOrPromise;
      });
  }

  /**
   * This function attaches a then() and a catch() to a promise that was
   * thrown from a selector's get(). If a selector's get() throws a promise,
   * we have two possibilities:
   *
   * 1. The promise will resolve, meaning one of our selector's dependencies is
   *    now available and we should "retry" our get() by running it again. This
   *    is the case handled by the attached then() handler.
   *
   * 2. The promise will throw because something went wrong with the dependency
   *    promise (in other words a real error occurred). This case is handled by
   *    the attached catch() handler. If the dependency promise throws, it is
   *    _always_ a real error and not another dependency promise (any dependency
   *    promises would have been handled upstream).
   *
   * The then() branch will eventually resolve to the final result of the
   * selector (or an error if a real error occurs), and the catch() will always
   * resolve to an error because the dependency promise is a promise that was
   * wrapped upstream, meaning it will only resolve to its real value or to a
   * real error.
   *
   * The execution will run to completion even if it is stale, and its value
   * will be cached. But stale executions will not update global state or update
   * executionInfo as that is the responsibility of the 'latest' execution.
   *
   * Note this function should not be passed a promise that was returned from
   * get(). The intention is that this function is only passed promises that
   * were thrown due to a pending dependency. Promises returned by get() should
   * be passed to wrapPendingPromise() instead.
   */
  function wrapPendingDependencyPromise(
    store: Store,
    promise: Promise<mixed | Canceled>,
    state: TreeState,
    existingDeps: DepValues,
    executionId: ExecutionId,
    loadingDepsState: LoadingDepsState,
  ): Promise<T | Canceled> {
    return promise
      .then(resolvedDep => {
        if (!selectorIsLive()) {
          // The selector was released since the request began; ignore the response.
          clearExecutionInfo(store, executionId);
          return CANCELED;
        }

        if (resolvedDep instanceof Canceled) {
          recoverableViolation(
            'Selector was released while it had dependencies',
            'recoil',
          );
          return CANCELED;
        }

        // Check if we are handling a pending Recoil dependency or if the user
        // threw their own Promise to "suspend" a selector evaluation.  We need
        // to check that the loadingDepPromise actually matches the promise that
        // we caught in case the selector happened to catch the promise we threw
        // for a pending Recoil dependency from `getRecoilValue()` and threw
        // their own promise instead.
        if (
          loadingDepsState.loadingDepKey != null &&
          loadingDepsState.loadingDepPromise === promise
        ) {
          /**
           * Note for async atoms, this means we are changing the atom's value
           * in the store for the given version. This should be alright because
           * the version of state is now stale and a new version will have
           * already been triggered by the atom being resolved (see this logic
           * in Recoil_atom.js)
           */
          state.atomValues.set(
            loadingDepsState.loadingDepKey,
            loadableWithValue(resolvedDep),
          );
        } else {
          /**
           * If resolvedDepKey is not defined, the promise was a user-thrown
           * promise. User-thrown promises are an advanced feature and they
           * should be avoided in almost all cases. Using `loadable.map()` inside
           * of selectors for loading loadables and then throwing that mapped
           * loadable's promise is an example of a user-thrown promise.
           *
           * When we hit a user-thrown promise, we have to bail out of an optimization
           * where we bypass calculating selector cache keys for selectors that
           * have been previously seen for a given state (these selectors are saved in
           * state.atomValues) to avoid stale state as we have no way of knowing
           * what state changes happened (if any) in result to the promise resolving.
           *
           * Ideally we would only bail out selectors that are in the chain of
           * dependencies for this selector, but there's currently no way to get
           * a full list of a selector's downstream nodes because the state that
           * is executing may be a discarded tree (so store.getGraph(state.version)
           * will be empty), and the full dep tree may not be in the selector
           * caches in the case where the selector's cache was cleared. To solve
           * for this we would have to keep track  of all running selector
           * executions and their downstream deps. Because this only covers edge
           * cases, that complexity might not be justifyable.
           */
          store.getState().knownSelectors.forEach(nodeKey => {
            state.atomValues.delete(nodeKey);
          });
        }

        /**
         * Optimization: Now that the dependency has resolved, let's try hitting
         * the cache in case the dep resolved to a value we have previously seen.
         *
         * TODO:
         * Note this optimization is not perfect because it only prevents re-executions
         * _after_ the point where an async dependency is found. Any code leading
         * up to the async dependency may have run unnecessarily. The ideal case
         * would be to wait for the async dependency to resolve first, check the
         * cache, and prevent _any_ execution of the selector if the resulting
         * value of the dependency leads to a path that is found in the cache.
         * The ideal case is more difficult to implement as it would require that
         * we capture and wait for the the async dependency right after checking
         * the cache. The current approach takes advantage of the fact that running
         * the selector already has a code path that lets us exit early when
         * an async dep resolves.
         */
        const cachedLoadable = getValFromCacheAndUpdatedDownstreamDeps(
          store,
          state,
        );

        if (cachedLoadable && cachedLoadable.state === 'hasValue') {
          setExecutionInfo(cachedLoadable, store);

          return cachedLoadable.contents;
        }

        /**
         * If this execution is stale, let's check to see if there is some in
         * progress execution with a matching state. If we find a match, then
         * we can take the value from that in-progress execution. Note this may
         * sound like an edge case, but may be very common in cases where a
         * loading dependency resolves from loading to having a value (thus
         * possibly triggering a re-render), and React re-renders before the
         * chained .then() functions run, thus starting a new execution as the
         * dep has changed value. Without this check we will run the selector
         * twice (once in the new execution and once again in this .then(), so
         * this check is necessary to keep unnecessary re-executions to a
         * minimum).
         *
         * Also note this code does not check across all executions that may be
         * running. It only optimizes for the _latest_ execution per store as
         * we currently do not maintain a list of all currently running executions.
         * This means in some cases we may run selectors more than strictly
         * necessary when there are multiple executions running for the same
         * selector. This may be a valid tradeoff as checking for dep changes
         * across all in-progress executions may take longer than just
         * re-running the selector. This will be app-dependent, and maybe in the
         * future we can make the behavior configurable. An ideal fix may be
         * to extend the tree cache to support caching loading states.
         */
        if (!isLatestExecution(store, executionId)) {
          const executionInfo = getExecutionInfoOfInProgressExecution(state);

          if (executionInfo?.latestLoadable?.state === 'loading') {
            /**
             * Returning promise here without wrapping as the wrapper logic was
             * already done upstream when this promise was generated.
             */
            return executionInfo.latestLoadable.contents;
          }
        }

        const [loadable, depValues] = evaluateSelectorGetter(
          store,
          state,
          executionId,
        );

        if (isLatestExecution(store, executionId)) {
          updateExecutionInfoDepValues(depValues, store, executionId);
        }

        if (loadable.state !== 'loading') {
          setCache(state, depValuesToDepRoute(depValues), loadable);
          setDepsInStore(store, state, new Set(depValues.keys()), executionId);
          setLoadableInStoreToNotifyDeps(store, loadable, executionId);
        }

        if (loadable.state === 'hasError') {
          throw loadable.contents;
        }

        /**
         * Returning any promises here without wrapping as the wrapepr logic was
         * already done when we called evaluateSelectorGetter() to get this
         * loadable
         */
        return loadable.contents;
      })
      .catch(error => {
        if (!selectorIsLive()) {
          // The selector was released since the request began; ignore the response.
          clearExecutionInfo(store, executionId);
          return CANCELED;
        }

        const loadable = loadableWithError(error);

        maybeFreezeValue(error);
        setCache(
          state,
          depValuesToDepRoute(existingDeps),
          loadableWithError(error),
        );
        setDepsInStore(store, state, new Set(existingDeps.keys()), executionId);

        setLoadableInStoreToNotifyDeps(store, loadable, executionId);

        throw error;
      });
  }

  function setLoadableInStoreToNotifyDeps(
    store: Store,
    loadable: Loadable<T>,
    executionId: ExecutionId,
  ): void {
    if (isLatestExecution(store, executionId)) {
      setExecutionInfo(loadable, store);
      notifyStoresOfSettledAsync(loadable, executionId);
    }
  }

  function setDepsInStore(
    store: Store,
    state: TreeState,
    deps: Set<NodeKey>,
    executionId: ?ExecutionId,
  ): void {
    if (
      isLatestExecution(store, executionId) ||
      state.version === store.getState()?.currentTree?.version ||
      state.version === store.getState()?.nextTree?.version
    ) {
      saveDependencyMapToStore(
        new Map([[key, deps]]),
        store,
        store.getState()?.nextTree?.version ??
          store.getState().currentTree.version,
      );
    }
  }

  function setNewDepInStore(
    store: Store,
    state: TreeState,
    deps: Set<NodeKey>,
    newDepKey: NodeKey,
    executionId: ?ExecutionId,
  ): void {
    deps.add(newDepKey);

    setDepsInStore(store, state, deps, executionId);
  }

  function evaluateSelectorGetter(
    store: Store,
    state: TreeState,
    executionId: ExecutionId,
  ): [Loadable<T>, DepValues] {
    const endPerfBlock = startPerfBlock(key); // TODO T63965866: use execution ID here
    let result;
    let resultIsError = false;
    let loadable: Loadable<T>;
    const loadingDepsState: LoadingDepsState = {
      loadingDepKey: null,
      loadingDepPromise: null,
    };

    const depValues = new Map();

    /**
     * Starting a fresh set of deps that we'll be using to update state. We're
     * starting a new set versus adding it in existing state deps because
     * the version of state that we update deps for may be a more recent version
     * than the version the selector was called with. This is because the latest
     * execution will update the deps of the current/latest version of state (
     * this is safe to do because the fact that the selector is the latest
     * execution means the deps we discover below are our best guess at the
     * deps for the current/latest state in the store)
     */
    const deps = new Set();

    setDepsInStore(store, state, deps, executionId);

    function getRecoilValue<S>(recoilValue: RecoilValue<S>): S {
      const {key: depKey} = recoilValue;

      setNewDepInStore(store, state, deps, depKey, executionId);

      const depLoadable = getCachedNodeLoadable(store, state, depKey);

      depValues.set(depKey, depLoadable);

      switch (depLoadable.state) {
        case 'hasValue':
          return depLoadable.contents;
        case 'hasError':
          throw depLoadable.contents;
        case 'loading':
          loadingDepsState.loadingDepKey = depKey;
          loadingDepsState.loadingDepPromise = depLoadable.contents;
          throw depLoadable.contents;
      }
      throw new Error('Invalid Loadable state');
    }

    let gateCallback = false;
    const getCallback: GetCallback = <Args: $ReadOnlyArray<mixed>, Return>(
      fn: ($ReadOnly<{snapshot: Snapshot}>) => (...Args) => Return,
    ): ((...Args) => Return) => {
      return (...args) => {
        if (!gateCallback) {
          throw new Error(
            'getCallback() should only be called asynchronously after the selector is evalutated.  It can be used for selectors to return objects with callbacks that can obtain the current Recoil state without a subscription.',
          );
        }
        const snapshot = cloneSnapshot(store);
        const cb = fn({snapshot});
        if (typeof cb !== 'function') {
          throw new Error(
            'getCallback() expects a function that returns a function.',
          );
        }
        return cb(...args);
      };
    };

    try {
      result = get({get: getRecoilValue, getCallback});
      result = isRecoilValue(result) ? getRecoilValue(result) : result;
      gateCallback = true;

      if (isPromise(result)) {
        result = wrapPendingPromise(
          store,
          result,
          state,
          depValues,
          executionId,
          loadingDepsState,
        ).finally(endPerfBlock);
      } else {
        endPerfBlock();
      }
    } catch (errorOrDepPromise) {
      result = errorOrDepPromise;

      if (isPromise(result)) {
        result = wrapPendingDependencyPromise(
          store,
          result,
          state,
          depValues,
          executionId,
          loadingDepsState,
        ).finally(endPerfBlock);
      } else {
        resultIsError = true;
        endPerfBlock();
      }
    }

    if (resultIsError) {
      loadable = loadableWithError(result);
    } else if (isPromise(result)) {
      loadable = loadableWithPromise<T>(result);
    } else {
      loadable = loadableWithValue<T>(result);
    }

    if (loadable.state !== 'loading') {
      maybeFreezeValue(loadable.contents);
    }

    return [loadable, depValues];
  }

  function getValFromCacheAndUpdatedDownstreamDeps(
    store: Store,
    state: TreeState,
  ): ?Loadable<T> {
    const depsAfterCacheDone = new Set();
    const executionInfo = getExecutionInfo(store);

    let cachedVal;
    try {
      cachedVal = cache.get(
        nodeKey => {
          invariant(
            typeof nodeKey === 'string',
            'Cache nodeKey is type string',
          );

          const loadable = getCachedNodeLoadable(store, state, nodeKey);

          return loadable.contents;
        },
        {
          onNodeVisit: node => {
            if (
              node.type === 'branch' &&
              node.nodeKey !== key &&
              typeof node.nodeKey === 'string'
            ) {
              depsAfterCacheDone.add(node.nodeKey);
            }
          },
        },
      );
    } catch (err) {
      throw new Error(
        `Problem with cache lookup for selector "${key}": ${err.message}`,
      );
    }

    /**
     * Ensure store contains correct dependencies if we hit the cache so that
     * the store deps and cache are in sync for a given state. This is important
     * because store deps are normally updated when new executions are created,
     * but cache hits don't trigger new executions but they still _may_ signifiy
     * a change in deps in the store if the store deps for this state are empty
     * or stale.
     */
    if (cachedVal) {
      setDepsInStore(
        store,
        state,
        depsAfterCacheDone,
        executionInfo.latestExecutionId,
      );
    }

    return cachedVal;
  }

  /**
   * FIXME: dep keys should take into account the state of the loadable to
   * prevent the edge case where a loadable with an error and a loadable with
   * an error as a value are treated as the same thing incorrectly. For example
   * these two should be treated differently:
   *
   * selector({key: '', get: () => new Error('hi')});
   * selector({key: '', get () => {throw new Error('hi')}});
   *
   * With current implementation they are treated the same
   */
  function depValuesToDepRoute(depValues: DepValues): NodeCacheRoute {
    return Array.from(depValues.entries()).map(([depKey, valLoadable]) => [
      depKey,
      valLoadable.contents,
    ]);
  }

  function getValFromRunningNewExecutionAndUpdatedDeps(
    store: Store,
    state: TreeState,
  ): Loadable<T> {
    const newExecutionId = getNewExecutionId();

    const [loadable, newDepValues] = evaluateSelectorGetter(
      store,
      state,
      newExecutionId,
    );

    setExecutionInfo(loadable, store, newDepValues, newExecutionId, state);
    maybeSetCacheWithLoadable(
      state,
      depValuesToDepRoute(newDepValues),
      loadable,
    );
    notifyStoreWhenAsyncSettles(store, loadable, newExecutionId);

    return loadable;
  }

  /**
   * Given a tree state, this function returns the "selector result", which is
   * defined as a size-2 tuple of [DependencyMap, Loadable<T>].
   *
   * The selector's get() function will only be re-evaluated if _both_ of the
   * following statements are true:
   *
   * 1. The current dep values from the given state produced a cache key that
   *    was not found in the cache.
   * 2. There is no currently running async execution OR there is an
   *    async execution that is running, but after comparing the dep values in
   *    the given state with the dep values that the execution has discovered so
   *    far we find that at least one dep value has changed, in which case we
   *    start a new execution (the previously running execution will continue to
   *    run to completion, but only the new execution will be deemed the
   *    'latest' execution, meaning it will be the only execution that will
   *    update global state when it is finished. Any non-latest executions will
   *    run to completion and update the selector cache but not global state).
   */
  function getSelectorValAndUpdatedDeps(
    store: Store,
    state: TreeState,
  ): Loadable<T> {
    const cachedVal = getValFromCacheAndUpdatedDownstreamDeps(store, state);

    if (cachedVal != null) {
      setExecutionInfo(cachedVal, store);
      return cachedVal;
    }

    const inProgressExecutionInfo =
      getExecutionInfoOfInProgressExecution(state);

    // FIXME: this won't work with custom caching b/c it uses separate cache
    if (inProgressExecutionInfo) {
      const executionInfo = inProgressExecutionInfo;

      notifyStoreWhenAsyncSettles(
        store,
        nullthrows(executionInfo.latestLoadable),
        nullthrows(executionInfo.latestExecutionId),
      );

      // FIXME: check after the fact to see if we made the right choice by waiting
      return nullthrows(executionInfo.latestLoadable);
    }

    return getValFromRunningNewExecutionAndUpdatedDeps(store, state);
  }

  /**
   * Searches execution info across all stores to see if there is an in-progress
   * execution whose dependency values match the values of the requesting store.
   */
  function getExecutionInfoOfInProgressExecution(
    state: TreeState,
  ): ?ExecutionInfo<T> {
    const [, executionInfo] =
      Array.from(executionInfoMap.entries()).find(([store, execInfo]) => {
        return (
          execInfo.latestLoadable != null &&
          execInfo.latestExecutionId != null &&
          !haveAsyncDepsChanged(store, state)
        );
      }) ?? [];

    return executionInfo;
  }

  const mapOfCheckedVersions = new Map();

  function haveAsyncDepsChanged(store: Store, state: TreeState): boolean {
    const executionInfo = getExecutionInfo(store);

    const oldDepValues =
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork ?? new Map();

    const cachedDepValuesCheckedForThisVersion = Array(
      (mapOfCheckedVersions.get(state.version) ?? new Map()).entries(),
    );

    const isCachedVersionSame =
      mapOfCheckedVersions.has(state.version) &&
      cachedDepValuesCheckedForThisVersion.length === oldDepValues.size &&
      cachedDepValuesCheckedForThisVersion.every(([nodeKey, nodeVal]) => {
        return oldDepValues.get(nodeKey) === nodeVal;
      });

    if (
      oldDepValues == null ||
      state.version === executionInfo.stateVersion ||
      isCachedVersionSame
    ) {
      return false;
    }

    mapOfCheckedVersions.set(state.version, new Map(oldDepValues));

    return Array.from(oldDepValues).some(([nodeKey, oldVal]) => {
      const loadable = getCachedNodeLoadable(store, state, nodeKey);

      return loadable.contents !== oldVal.contents;
    });
  }

  /**
   * This function will update the selector's execution info when the selector
   * has either finished running an execution or has started a new execution. If
   * the given loadable is in a 'loading' state, the intention is that a new
   * execution has started. Otherwise, the intention is that an execution has
   * just finished.
   */
  function setExecutionInfo(
    loadable: Loadable<T>,
    store: Store,
    depValues?: DepValues,
    newExecutionId?: ExecutionId,
    state?: TreeState,
  ) {
    const executionInfo = getExecutionInfo(store);

    if (loadable.state === 'loading') {
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = depValues;
      executionInfo.latestExecutionId = newExecutionId;
      executionInfo.latestLoadable = loadable;
      executionInfo.stateVersion = state?.version;
    } else {
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = null;
      executionInfo.latestExecutionId = null;
      executionInfo.latestLoadable = null;
      executionInfo.stateVersion = null;
    }
  }

  /**
   * Conditionally updates the cache with a given loadable.
   *
   * We only cache loadables that are not loading because our cache keys are
   * based on dep values, which are in an unfinished state for loadables that
   * have a 'loading' state (new deps may be discovered while the selector
   * runs its async code). We never want to cache partial dependencies b/c it
   * could lead to errors, such as prematurely returning the result based on a
   * partial list of deps-- we need the full list of deps to ensure that we
   * are returning the correct result from cache.
   */
  function maybeSetCacheWithLoadable(
    state: TreeState,
    depRoute: NodeCacheRoute,
    loadable: Loadable<T>,
  ) {
    if (loadable.state !== 'loading') {
      setCache(state, depRoute, loadable);
    }
  }

  function updateExecutionInfoDepValues(
    depValues: DepValues,
    store: Store,
    executionId: ExecutionId,
  ) {
    const executionInfo = getExecutionInfo(store);

    if (isLatestExecution(store, executionId)) {
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = depValues;
    }
  }

  function clearExecutionInfo(store: Store, executionId: ExecutionId) {
    if (isLatestExecution(store, executionId)) {
      executionInfoMap.delete(store);
    }
  }

  function isLatestExecution(store: Store, executionId): boolean {
    const executionInfo = getExecutionInfo(store);

    return executionId === executionInfo.latestExecutionId;
  }

  function maybeFreezeValue(val) {
    if (__DEV__) {
      if (Boolean(options.dangerouslyAllowMutability) === false) {
        deepFreezeValue(val);
      }
    }
  }

  function setCache(
    state: TreeState,
    cacheRoute: NodeCacheRoute,
    loadable: Loadable<T>,
  ) {
    state.atomValues.set(key, loadable);
    try {
      cache.set(cacheRoute, loadable);
    } catch (err) {
      throw new Error(
        `Problem with setting cache for selector "${key}": ${err.message}`,
      );
    }
  }

  function detectCircularDependencies(fn) {
    if (dependencyStack.includes(key)) {
      const message = `Recoil selector has circular dependencies: ${dependencyStack
        .slice(dependencyStack.indexOf(key))
        .join(' \u2192 ')}`;
      return loadableWithError(new Error(message));
    }
    dependencyStack.push(key);
    try {
      return fn();
    } finally {
      dependencyStack.pop();
    }
  }

  function selectorPeek(store: Store, state: TreeState): ?Loadable<T> {
    const cacheVal = cache.get(nodeKey => {
      invariant(typeof nodeKey === 'string', 'Cache nodeKey is type string');

      const peek = peekNodeLoadable(store, state, nodeKey);

      return peek?.contents;
    });

    return cacheVal;
  }

  function selectorGet(store: Store, state: TreeState): Loadable<T> {
    return detectCircularDependencies(() =>
      getSelectorValAndUpdatedDeps(store, state),
    );
  }

  function invalidateSelector(state: TreeState) {
    state.atomValues.delete(key);
  }

  if (set != null) {
    /**
     * ES5 strict mode prohibits defining non-top-level function declarations,
     * so don't use function declaration syntax here
     */
    const selectorSet = (store, state, newValue): AtomWrites => {
      let syncSelectorSetFinished = false;
      const writes: AtomWrites = new Map();

      function getRecoilValue<S>({key: depKey}: RecoilValue<S>): S {
        if (syncSelectorSetFinished) {
          throw new Error(
            'Recoil: Async selector sets are not currently supported.',
          );
        }

        const loadable = getCachedNodeLoadable(store, state, depKey);

        if (loadable.state === 'hasValue') {
          return loadable.contents;
        } else if (loadable.state === 'loading') {
          throw new RecoilValueNotReady(depKey);
        } else {
          throw loadable.contents;
        }
      }

      function setRecoilState<S>(
        recoilState: RecoilState<S>,
        valueOrUpdater: S | DefaultValue | ((S, GetRecoilValue) => S),
      ) {
        if (syncSelectorSetFinished) {
          throw new Error(
            'Recoil: Async selector sets are not currently supported.',
          );
        }

        const setValue =
          typeof valueOrUpdater === 'function'
            ? // cast to any because we can't restrict type S from being a function itself without losing support for opaque types
              // flowlint-next-line unclear-type:off
              (valueOrUpdater: any)(getRecoilValue(recoilState))
            : valueOrUpdater;

        const upstreamWrites = setNodeValue(
          store,
          state,
          recoilState.key,
          setValue,
        );

        upstreamWrites.forEach((v, k) => writes.set(k, v));
      }

      function resetRecoilState<S>(recoilState: RecoilState<S>) {
        setRecoilState(recoilState, DEFAULT_VALUE);
      }

      const ret = set(
        {set: setRecoilState, get: getRecoilValue, reset: resetRecoilState},
        newValue,
      );

      // set should be a void method, but if the user makes it `async`, then it
      // will return a Promise, which we don't currently support.
      if (ret !== undefined) {
        throw isPromise(ret)
          ? new Error(
              'Recoil: Async selector sets are not currently supported.',
            )
          : new Error('Recoil: selector set should be a void function.');
      }
      syncSelectorSetFinished = true;

      return writes;
    };

    return registerNode<T>({
      key,
      nodeType: 'selector',
      peek: selectorPeek,
      get: selectorGet,
      set: selectorSet,
      init: selectorInit,
      invalidate: invalidateSelector,
      shouldDeleteConfigOnRelease: selectorShouldDeleteConfigOnRelease,
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      shouldRestoreFromSnapshots: false,
      retainedBy,
    });
  } else {
    return registerNode<T>({
      key,
      nodeType: 'selector',
      peek: selectorPeek,
      get: selectorGet,
      init: selectorInit,
      invalidate: invalidateSelector,
      shouldDeleteConfigOnRelease: selectorShouldDeleteConfigOnRelease,
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      shouldRestoreFromSnapshots: false,
      retainedBy,
    });
  }
}

/* eslint-enable no-redeclare */

module.exports = selector;
