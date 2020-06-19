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
import type {DefaultValue} from '../core/Recoil_Node';
import type {
  RecoilState,
  RecoilValue,
  RecoilValueReadOnly,
} from '../core/Recoil_RecoilValue';
import type {NodeKey, Store, TreeState} from '../core/Recoil_State';

const {
  loadableWithError,
  loadableWithPromise,
  loadableWithValue,
} = require('../adt/Recoil_Loadable');
const cacheWithReferenceEquality = require('../caches/Recoil_cacheWithReferenceEquality');
const {
  detectCircularDependencies,
  getNodeLoadable,
  setNodeValue,
} = require('../core/Recoil_FunctionalCore');
const {
  DEFAULT_VALUE,
  RecoilValueNotReady,
  registerNode,
} = require('../core/Recoil_Node');
const {isRecoilValue} = require('../core/Recoil_RecoilValue');
const {
  mapBySettingInMap,
  mapByUpdatingInMap,
  setByAddingToSet,
  setByDeletingFromSet,
} = require('../util/Recoil_CopyOnWrite');
const deepFreezeValue = require('../util/Recoil_deepFreezeValue');
const differenceSets = require('../util/Recoil_differenceSets');
const equalsSet = require('../util/Recoil_equalsSet');
const isPromise = require('../util/Recoil_isPromise');
const nullthrows = require('../util/Recoil_nullthrows');
const {startPerfBlock} = require('../util/Recoil_PerformanceTimings');
const traverseDepGraph = require('../util/Recoil_traverseDepGraph');

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

// Array of interlaced node keys and values
type CacheKey = $ReadOnlyArray<mixed>;
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
};

/**
 * A state containier is needed to capture the _latest_ value of state for
 * asynchronous work. For async work, a selector will continue generating a new
 * state every time it comes across a dependency; in order to pass that state
 * around to other functions, we need to wrap it around another object so that
 * the enclosing function can asynchronously access the latest state (i.e. after
 * a promise resolves). Otherwise the wrapping function will use a stale version
 * of state.
 */
type StateContainer = {current: TreeState};

const emptySet: $ReadOnlySet<NodeKey> = Object.freeze(new Set());

function cacheKeyFromDepValues(depValues: DepValues): CacheKey {
  const answer = [];
  for (const key of Array.from(depValues.keys()).sort()) {
    const loadable = nullthrows(depValues.get(key));
    answer.push(key);
    answer.push(loadable.contents);
  }
  return answer;
}

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
  };
}

function selector<T>(
  options: ReadOnlySelectorOptions<T> | ReadWriteSelectorOptions<T>,
): RecoilValue<T> {
  const {key, get, cacheImplementation_UNSTABLE: cacheImplementation} = options;
  const set = options.set != null ? options.set : undefined; // flow

  let cache: CacheImplementation<Loadable<T>> =
    cacheImplementation ?? cacheWithReferenceEquality();

  const executionInfo: ExecutionInfo<T> = getInitialExecutionInfo();

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
    stateContainer: StateContainer,
    depValues: DepValues,
    executionId: ExecutionId,
  ): LoadablePromise<T> {
    return promise
      .then(value => {
        const loadable = loadableWithValue(value);
        const {current: state} = stateContainer;

        maybeFreezeValue(value);
        setCache(cacheKeyFromDepValues(depValues), loadable);

        if (isLatestExecution(executionId)) {
          setExecutionInfo(loadable);
          updateStateWithNewDepsFromAsync(store, state);
          fireNodeSubscriptions(store);
        }

        return {
          value,
          upstreamState__INTERNAL_DO_NOT_USE: state,
        };
      })
      .catch(errorOrPromise => {
        const {current: state} = stateContainer;

        if (isLatestExecution(executionId)) {
          updateExecutionInfoDepValues(depValues);
          updateStateWithNewDepsFromAsync(store, state);
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
        setCache(cacheKeyFromDepValues(depValues), loadable);

        if (isLatestExecution(executionId)) {
          setExecutionInfo(loadable);
          fireNodeSubscriptions(store);
        }

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
      .then(({upstreamState__INTERNAL_DO_NOT_USE: depState}) => {
        const [newState, loadable, depValues] = evaluateSelectorGetter(
          store,
          mergeUpstreamStateWithCurrentState(nullthrows(depState), state, key),
          executionId,
        );

        if (isLatestExecution(executionId)) {
          updateExecutionInfoDepValues(depValues);
          updateStateWithNewDepsFromAsync(store, newState);
        }

        maybeFreezeLoadableContents(loadable);

        if (loadable.state !== 'loading') {
          setCache(cacheKeyFromDepValues(depValues), loadable);
        }

        if (loadable.state !== 'loading' && isLatestExecution(executionId)) {
          setExecutionInfo(loadable);
          fireNodeSubscriptions(store);
        }

        if (loadable.state === 'hasError') {
          throw loadable.contents;
        }

        if (loadable.state !== 'loading') {
          return {
            value: loadable.contents,
            upstreamState__INTERNAL_DO_NOT_USE: newState,
          };
        }

        return loadable.contents;
      })
      .catch(error => {
        const loadable = loadableWithError(error);

        maybeFreezeValue(error);
        setCache(cacheKeyFromDepValues(existingDeps), loadableWithError(error));

        if (isLatestExecution(executionId)) {
          setExecutionInfo(loadable);
          fireNodeSubscriptions(store);
        }

        throw error;
      });
  }

  function evaluateSelectorGetter(
    store: Store,
    state: TreeState,
    executionId: ExecutionId,
  ): [TreeState, Loadable<T>, DepValues] {
    const endPerfBlock = startPerfBlock(key); // TODO T63965866: use execution ID here
    let result;
    let loadable: Loadable<T>;

    const newStateContainer: StateContainer = {current: state};
    const depValues = new Map();

    function getRecoilValue<S>(recoilValue: RecoilValue<S>): S {
      const {key: depKey} = recoilValue;

      const stateContainingNewDepKey = getNewStateByAddingAndRemovingDeps(
        newStateContainer.current,
        setByAddingToSet(new Set(depValues.keys()), depKey),
        key,
      );

      const [newStateByEvaluatingDep, depLoadable] = getNodeLoadable(
        store,
        stateContainingNewDepKey,
        depKey,
      );

      depValues.set(depKey, depLoadable);
      newStateContainer.current = newStateByEvaluatingDep;

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
          newStateContainer,
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
          newStateContainer.current,
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

    return [newStateContainer.current, loadable, depValues];
  }

  function getNewStateByAddingAndRemovingDeps(
    state: TreeState,
    newDeps: Set<NodeKey>,
    selectorKey: NodeKey,
  ): TreeState {
    const oldDeps = state.nodeDeps.get(selectorKey) ?? emptySet;
    const addedDeps = differenceSets(newDeps, oldDeps);
    const removedDeps = differenceSets(oldDeps, newDeps);

    let newState = equalsSet(oldDeps, newDeps)
      ? state
      : {
          ...state,
          nodeDeps: mapBySettingInMap(state.nodeDeps, selectorKey, newDeps),
        };

    for (const upstreamNode of addedDeps) {
      newState = {
        ...newState,
        nodeToNodeSubscriptions: mapByUpdatingInMap(
          newState.nodeToNodeSubscriptions,
          upstreamNode,
          subs => setByAddingToSet(subs ?? emptySet, selectorKey),
        ),
      };
    }

    for (const upstreamNode of removedDeps) {
      newState = {
        ...newState,
        nodeToNodeSubscriptions: mapByUpdatingInMap(
          newState.nodeToNodeSubscriptions,
          upstreamNode,
          subs => setByDeletingFromSet(subs ?? emptySet, selectorKey),
        ),
      };
    }

    if (__DEV__) {
      detectCircularDependencies(newState, [key]);
    }

    return newState;
  }

  function getCurrDepValues(
    store: Store,
    state: TreeState,
  ): [DepValues, TreeState] {
    const currentDeps = state.nodeDeps.get(key) ?? emptySet;
    const currDepValues = new Map();

    let newStateFromGettingDeps = state;

    Array.from(currentDeps)
      .sort()
      .forEach(depKey => {
        const [newState, loadable] = getNodeLoadable(
          store,
          newStateFromGettingDeps,
          depKey,
        );

        newStateFromGettingDeps = newState;
        currDepValues.set(depKey, loadable);
      });

    return [currDepValues, newStateFromGettingDeps];
  }

  /**
   * Given a tree state, this function returns the "selector result", which is
   * defined as a size-2 tuple of [TreeState, Loadable<T>].
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
  function getSelectorResult(
    store: Store,
    state: TreeState,
  ): [TreeState, Loadable<T>] {
    const [currDepValues, newStateFromGettingDeps] = getCurrDepValues(
      store,
      state,
    );
    const currCacheKey = cacheKeyFromDepValues(currDepValues);
    const cachedVal = cache.get(currCacheKey);

    if (cachedVal != null) {
      return [newStateFromGettingDeps, cachedVal];
    }

    // FIXME: this won't work with never caching cache b/c its separate from cache
    // TODO rename to depValues
    if (asyncWorkIsInProgressAndDepsHaveNotChanged(currDepValues)) {
      return [
        newStateFromGettingDeps,
        nullthrows(executionInfo.latestLoadable),
      ];
    }

    const newExecutionId = getNewExecutionId();

    const [
      newStateFromEvaluatingSelector,
      loadable,
      newDepValues,
    ] = evaluateSelectorGetter(store, newStateFromGettingDeps, newExecutionId);

    setExecutionInfo(loadable, newDepValues, newExecutionId);
    maybeSetCacheWithLoadable(newDepValues, loadable);

    return [newStateFromEvaluatingSelector, loadable];
  }

  function asyncWorkIsInProgressAndDepsHaveNotChanged(depValues: DepValues) {
    return (
      executionInfo.latestLoadable != null &&
      executionInfo.latestExecutionId != null &&
      !haveAsyncDepsChanged(depValues)
    );
  }

  function haveAsyncDepsChanged(newDepValues: DepValues): boolean {
    const oldDepValues = executionInfo.depValuesDiscoveredSoFarDuringAsyncWork;

    if (oldDepValues == null || newDepValues == null) {
      return false;
    }

    return Array.from(oldDepValues).some(
      ([key, oldVal]) =>
        newDepValues.has(key) &&
        nullthrows(newDepValues.get(key)).contents !== oldVal.contents &&
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
        !(
          oldVal.state === 'loading' &&
          nullthrows(newDepValues.get(key)).state !== 'loading'
        ),
    );
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
  ) {
    if (loadable.state === 'loading') {
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = depValues;
      executionInfo.latestExecutionId = newExecutionId;
      executionInfo.latestLoadable = loadable;
    } else {
      executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = null;
      executionInfo.latestExecutionId = null;
      executionInfo.latestLoadable = null;
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
    depValues: DepValues,
    loadable: Loadable<T>,
  ) {
    if (loadable.state !== 'loading') {
      setCache(cacheKeyFromDepValues(depValues), loadable);
    }
  }

  function updateExecutionInfoDepValues(depValues: DepValues) {
    executionInfo.depValuesDiscoveredSoFarDuringAsyncWork = depValues;
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

  /**
   * This function should only be called from async code b/c synchronous
   * selectors will have their state updated upstream (hence why we return a
   * a new state from the get() in the object passed to registerNode())
   *
   * This function makes the assumption that any upstream dependencies have
   * already updated global state with their dependencies, hence why this
   * function only updates latest states with its own new dependencies.
   */
  function updateStateWithNewDepsFromAsync(store: Store, state: TreeState) {
    store.replaceState(latestState => {
      return mergeUpstreamStateWithCurrentState(state, latestState, key);
    });
  }

  function mergeUpstreamStateWithCurrentState(
    upstreamState: TreeState,
    currentState: TreeState,
    nodeKey: NodeKey,
  ): TreeState {
    let newStateAfterMerge = currentState;

    traverseDepGraph(upstreamState.nodeDeps, [nodeKey], ({key, deps}) => {
      newStateAfterMerge = getNewStateByAddingAndRemovingDeps(
        newStateAfterMerge,
        deps,
        key,
      );
    });

    return newStateAfterMerge;
  }

  function fireNodeSubscriptions(store: Store) {
    store.fireNodeSubscriptions(new Set([key]), 'now');
  }

  function setCache(key, val) {
    cache = cache.set(key, val);
  }

  function myGet(store: Store, state: TreeState): [TreeState, Loadable<T>] {
    // TODO memoize a value if no deps have changed to avoid a cache lookup
    return getSelectorResult(store, state);
  }

  if (set != null) {
    function mySet(store, state, newValue) {
      let newState = state;
      const writtenNodes: Set<NodeKey> = new Set();

      function getRecoilValue<S>({key}: RecoilValue<S>): S {
        const [nextState, loadable] = getNodeLoadable(store, newState, key);
        newState = nextState;
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
        let written: $ReadOnlySet<NodeKey>;
        [newState, written] = setNodeValue(
          store,
          newState,
          recoilState.key,
          newValue,
        );
        written.forEach(atom => writtenNodes.add(atom));
      }

      function resetRecoilState<S>(recoilState: RecoilState<S>) {
        setRecoilState(recoilState, DEFAULT_VALUE);
      }

      set(
        {set: setRecoilState, get: getRecoilValue, reset: resetRecoilState},
        newValue,
      );
      return [newState, writtenNodes];
    }
    return registerNode<T>({
      key,
      options,
      get: myGet,
      set: mySet,
    });
  } else {
    return registerNode<T>({
      key,
      options,
      get: myGet,
    });
  }
}
/* eslint-enable no-redeclare */

module.exports = selector;
