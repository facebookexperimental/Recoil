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

import type {Loadable, LoadablePromise} from '../adt/Recoil_Loadable';
import type {CacheImplementation} from '../caches/Recoil_Cache';
import type {NodeCache, NodeCacheRoute} from '../caches/Recoil_NodeCache';
import type {DependencyMap} from '../core/Recoil_Graph';
import type {DefaultValue} from '../core/Recoil_Node';
import type {
  RecoilState,
  RecoilValue,
  RecoilValueReadOnly,
} from '../core/Recoil_RecoilValue';
import type {AtomValues, NodeKey, Store, TreeState} from '../core/Recoil_State';

import {
  loadableWithError,
  loadableWithPromise,
  loadableWithValue,
} from '../adt/Recoil_Loadable';
import cacheMostRecent from '../caches/Recoil_cacheMostRecent';
import cacheWithReferenceEquality from '../caches/Recoil_cacheWithReferenceEquality';
import cacheWithValueEquality from '../caches/Recoil_cacheWithValueEquality';
import nodeCacheMostRecent from '../caches/Recoil_nodeCacheMostRecent';
import treeCacheReferenceEquality from '../caches/Recoil_treeCacheReferenceEquality';
import treeCacheValueEquality from '../caches/Recoil_treeCacheValueEquality';
import {
  getNodeLoadable,
  peekNodeLoadable,
  setNodeValue,
} from '../core/Recoil_FunctionalCore';
import {saveDependencyMapToStore} from '../core/Recoil_Graph';
import {
  DEFAULT_VALUE,
  RecoilValueNotReady,
  registerNode,
} from '../core/Recoil_Node';
import {isRecoilValue} from '../core/Recoil_RecoilValue';
import {AbstractRecoilValue} from '../core/Recoil_RecoilValue';
import {setRecoilValueLoadable} from '../core/Recoil_RecoilValueInterface';
import deepFreezeValue from '../util/Recoil_deepFreezeValue';
import isPromise from '../util/Recoil_isPromise';
import nullthrows from '../util/Recoil_nullthrows';
import {startPerfBlock} from '../util/Recoil_PerformanceTimings';

export type ValueOrUpdater<T> =
  | T
  | DefaultValue
  | ((prevValue: T) => T | DefaultValue);
export type GetRecoilValue = <T>(RecoilValue<T>) => T;
export type SetRecoilState = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
export type ResetRecoilState = <T>(RecoilState<T>) => void;

type ReadOnlySelectorOptions<T> = $ReadOnly<{
  key: string,
  get: ({get: GetRecoilValue}) => Promise<T> | RecoilValue<T> | T,

  cacheImplementation_UNSTABLE?: CacheImplementation<Loadable<T>>,
  dangerouslyAllowMutability?: boolean,
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

// flowlint-next-line unclear-type:off
const emptySet: $ReadOnlySet<any> = Object.freeze(new Set());

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

/* eslint-enable no-redeclare */ export default function selector<T>(
  options: ReadOnlySelectorOptions<T> | ReadWriteSelectorOptions<T>,
): RecoilValue<T> {
  const {key, get, cacheImplementation_UNSTABLE: cacheImplementation} = options;
  const set = options.set != null ? options.set : undefined; // flow

  /**
   * HACK: doing this as a way to map given cache to corresponding tree cache
   */
  const cache: NodeCache<T> =
    cacheImplementation === cacheWithReferenceEquality
      ? treeCacheReferenceEquality()
      : cacheImplementation === cacheWithValueEquality
      ? treeCacheValueEquality()
      : cacheImplementation === cacheMostRecent
      ? nodeCacheMostRecent()
      : treeCacheReferenceEquality();

  const executionInfo: ExecutionInfo<T> = getInitialExecutionInfo();

  function initSelector(store: Store) {
    store.getState().knownSelectors.add(key);
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

  /**
   * FIXME: we should keep track of latest execution id _per store_ and update
   * the stores accordingly.
   */
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

  function getCachedNodeLoadable<T>(
    store: Store,
    state: TreeState,
    key: NodeKey,
  ): [DependencyMap, Loadable<T>] {
    if (state.atomValues.has(key)) {
      return [new Map(), nullthrows(state.atomValues.get(key))];
    }

    const [, loadable] = getNodeLoadable(store, state, key);
    const isKeyPointingToSelector = store.getState().knownSelectors.has(key);

    if (loadable.state !== 'loading' && isKeyPointingToSelector) {
      state.atomValues.set(key, loadable);
    }

    return [new Map(), loadable];
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
  ): LoadablePromise<T> {
    return promise
      .then(value => {
        const loadable = loadableWithValue(value);

        maybeFreezeValue(value);
        setCache(state, depValuesToDepRoute(depValues), loadable);

        setLoadableInStoreToNotifyDeps(loadable, executionId);

        return {__value: value, __key: key};
      })
      .catch(errorOrPromise => {
        if (isLatestExecution(executionId)) {
          updateExecutionInfoDepValues(depValues, executionId);
        }

        if (isPromise(errorOrPromise)) {
          return wrapPendingDependencyPromise(
            store,
            errorOrPromise,
            state,
            depValues,
            executionId,
          );
        }

        const loadable = loadableWithError(errorOrPromise);

        maybeFreezeValue(errorOrPromise);
        setCache(state, depValuesToDepRoute(depValues), loadable);

        setLoadableInStoreToNotifyDeps(loadable, executionId);

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
    promise: LoadablePromise<mixed>,
    state: TreeState,
    existingDeps: DepValues,
    executionId: ExecutionId,
  ): LoadablePromise<T> {
    return promise
      .then(resolvedDep => {
        const {__key: resolvedDepKey, __value: depValue} = resolvedDep;

        if (resolvedDepKey != null) {
          /**
           * Note for async atoms, this means we are changing the atom's value
           * in the store for the given version. This should be alright because
           * the version of state is now stale and a new version will have
           * already been triggered by the atom being resolved (see this logic
           * in Recoil_atom.js)
           */
          state.atomValues.set(resolvedDepKey, loadableWithValue(depValue));
        }

        const [loadable, depValues] = evaluateSelectorGetter(
          store,
          state,
          executionId,
        );

        if (isLatestExecution(executionId)) {
          updateExecutionInfoDepValues(depValues, executionId);
        }

        maybeFreezeLoadableContents(loadable);

        if (loadable.state !== 'loading') {
          setCache(state, depValuesToDepRoute(depValues), loadable);
          setLoadableInStoreToNotifyDeps(loadable, executionId);
        }

        if (loadable.state === 'hasError') {
          throw loadable.contents;
        }

        if (loadable.state === 'hasValue') {
          return {__value: loadable.contents, __key: key};
        }

        /**
         * Returning promise here without wrapping as the wrapepr logic was
         * already done when we called evaluateSelectorGetter() to get this
         * loadable
         */
        return loadable.contents;
      })
      .catch(error => {
        const loadable = loadableWithError(error);

        maybeFreezeValue(error);
        setCache(
          state,
          depValuesToDepRoute(existingDeps),
          loadableWithError(error),
        );

        setLoadableInStoreToNotifyDeps(loadable, executionId);

        throw error;
      });
  }

  function setLoadableInStoreToNotifyDeps(
    loadable: Loadable<T>,
    executionId: ExecutionId,
  ): void {
    if (isLatestExecution(executionId)) {
      setExecutionInfo(loadable);
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
      isLatestExecution(executionId) ||
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
    let loadable: Loadable<T>;

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

      const [, depLoadable] = getCachedNodeLoadable(store, state, depKey);

      depValues.set(depKey, depLoadable);

      if (depLoadable.state === 'hasValue') {
        return depLoadable.contents;
      }

      throw depLoadable.contents;
    }

    try {
      result = get({get: getRecoilValue});
      result = isRecoilValue(result) ? getRecoilValue(result) : result;

      if (isPromise(result)) {
        result = wrapPendingPromise(
          store,
          result,
          state,
          depValues,
          executionId,
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
        ).finally(endPerfBlock);
      } else {
        endPerfBlock();
      }
    }

    if (result instanceof Error) {
      loadable = loadableWithError(result);
    } else if (isPromise(result)) {
      loadable = loadableWithPromise<T>(result);
    } else {
      loadable = loadableWithValue<T>(result);
    }

    maybeFreezeLoadableContents(loadable);

    return [loadable, depValues];
  }

  function getValFromCacheAndUpdatedDownstreamDeps(
    store: Store,
    state: TreeState,
  ): ?Loadable<T> {
    if (state.atomValues.has(key)) {
      return state.atomValues.get(key);
    }

    const deps = new Set(
      store.getGraph(state.version).nodeDeps.get(key) ?? emptySet,
    );

    setDepsInStore(store, state, deps, executionInfo.latestExecutionId);

    const cachedVal = cache.get(
      nodeKey => {
        const [, loadable] = getCachedNodeLoadable(store, state, nodeKey);

        return loadable.contents;
      },
      {
        onCacheHit: nodeKey => {
          if (nodeKey !== key) {
            setNewDepInStore(
              store,
              state,
              deps,
              nodeKey,
              executionInfo.latestExecutionId,
            );
          }
        },
      },
    );

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
    return Array.from(depValues.entries()).map(([key, valLoadable]) => [
      key,
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

    setExecutionInfo(loadable, newDepValues, newExecutionId, state);
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
      setExecutionInfo(cachedVal);
      return cachedVal;
    }

    // FIXME: this won't work with custom caching b/c it uses separate cache
    if (asyncWorkIsInProgressAndDepsDiscoveredHaveNotChanged(store, state)) {
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

  function asyncWorkIsInProgressAndDepsDiscoveredHaveNotChanged(
    store: Store,
    state: TreeState,
  ) {
    return (
      executionInfo.latestLoadable != null &&
      executionInfo.latestExecutionId != null &&
      !haveAsyncDepsChanged(store, state)
    );
  }

  const mapOfCheckedVersions = new Map();

  function haveAsyncDepsChanged(store: Store, state: TreeState): boolean {
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
      const [, loadable] = getCachedNodeLoadable(store, state, nodeKey);

      return (
        loadable.contents !== oldVal.contents &&
        /**
         * FIXME: in the condition below we're making the assumption that a
         * dependency that goes from loading to having a value is always because
         * the dependency resolved to that value, so we don't count it as a dep
         * change as the normal retry loop will handle retrying in response to a
         * resolved async dep. This is an incorrect assumption for the edge case
         * where there is an async selector that is loading, and while it is
         * loading one of its dependencies changes, triggering a new execution,
         * and that new execution produces a value synchronously (we don't make
         * that assumption for asynchronous work b/c it's guaranteed that a
         * loadable that goes from 'loading' to 'loading' in a new loadable is
         * a dep change).
         */
        !(oldVal.state === 'loading' && loadable.state !== 'loading')
      );
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
    depValues?: DepValues,
    newExecutionId?: ExecutionId,
    state?: TreeState,
  ) {
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
    executionId: ExecutionId,
  ) {
    if (isLatestExecution(executionId)) {
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = depValues;
    }
  }

  function isLatestExecution(executionId): boolean {
    return executionId === executionInfo.latestExecutionId;
  }

  function maybeFreezeLoadableContents(loadable: Loadable<T>) {
    if (loadable.state !== 'loading') {
      maybeFreezeValue(loadable.contents);
    }
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
    cache.set(cacheRoute, loadable);
  }

  function detectCircularDependencies(fn) {
    if (dependencyStack.includes(key)) {
      const message = `Recoil selector has circular dependencies: ${dependencyStack
        .slice(dependencyStack.indexOf(key))
        .join(' \u2192 ')}`;
      // eslint-disable-next-line fb-www/no-new-error
      return loadableWithError(new Error(message));
    }
    dependencyStack.push(key);
    try {
      return fn();
    } finally {
      dependencyStack.pop();
    }
  }

  function myPeek(store: Store, state: TreeState): ?Loadable<T> {
    const cacheVal = cache.get(nodeKey => {
      const peek = peekNodeLoadable(store, state, nodeKey);

      return peek?.contents;
    });

    return cacheVal;
  }

  function myGet(store: Store, state: TreeState): [DependencyMap, Loadable<T>] {
    initSelector(store);

    return [
      new Map(),
      detectCircularDependencies(() =>
        getSelectorValAndUpdatedDeps(store, state),
      ),
    ];
  }

  function invalidate(state: TreeState) {
    state.atomValues.delete(key);
  }

  if (set != null) {
    function mySet(store, state, newValue): [DependencyMap, AtomValues] {
      initSelector(store);

      const dependencyMap: DependencyMap = new Map();
      const writes: AtomValues = new Map();

      function getRecoilValue<S>({key}: RecoilValue<S>): S {
        const [, loadable] = getCachedNodeLoadable(store, state, key);

        if (loadable.state === 'hasValue') {
          return loadable.contents;
        } else if (loadable.state === 'loading') {
          throw new RecoilValueNotReady(key);
        } else {
          throw loadable.contents;
        }
      }

      function setRecoilState<S>(
        recoilState: RecoilState<S>,
        valueOrUpdater: S | DefaultValue | ((S, GetRecoilValue) => S),
      ) {
        const newValue =
          typeof valueOrUpdater === 'function'
            ? // cast to any because we can't restrict type S from being a function itself without losing support for opaque types
              // flowlint-next-line unclear-type:off
              (valueOrUpdater: any)(getRecoilValue(recoilState))
            : valueOrUpdater;

        const [, upstreamWrites] = setNodeValue(
          store,
          state,
          recoilState.key,
          newValue,
        );

        upstreamWrites.forEach((v, k) => writes.set(k, v));
      }

      function resetRecoilState<S>(recoilState: RecoilState<S>) {
        setRecoilState(recoilState, DEFAULT_VALUE);
      }

      set(
        {set: setRecoilState, get: getRecoilValue, reset: resetRecoilState},
        newValue,
      );

      return [dependencyMap, writes];
    }

    return registerNode<T>({
      key,
      peek: myPeek,
      get: myGet,
      set: mySet,
      cleanUp: () => {},
      invalidate,
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      shouldRestoreFromSnapshots: false,
    });
  } else {
    return registerNode<T>({
      key,
      peek: myPeek,
      get: myGet,
      cleanUp: () => {},
      invalidate,
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      shouldRestoreFromSnapshots: false,
    });
  }
}
