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
import type {CacheImplementation} from '../caches/Recoil_Cache';
import type {DependencyMap} from '../core/Recoil_Graph';
import type {DefaultValue} from '../core/Recoil_Node';
import type {
  RecoilState,
  RecoilValue,
  RecoilValueReadOnly,
} from '../core/Recoil_RecoilValue';
import type {AtomValues, NodeKey, Store, TreeState} from '../core/Recoil_State';

const {
  loadableWithError,
  loadableWithPromise,
  loadableWithValue,
} = require('../adt/Recoil_Loadable');
const cacheWithReferenceEquality = require('../caches/Recoil_cacheWithReferenceEquality');
const {
  getNodeLoadable,
  setNodeValue,
} = require('../core/Recoil_FunctionalCore');
const {
  addToDependencyMap,
  mergeDepsIntoDependencyMap,
} = require('../core/Recoil_Graph');
const {
  DEFAULT_VALUE,
  RecoilValueNotReady,
  registerNode,
} = require('../core/Recoil_Node');
const {AbstractRecoilValue} = require('../core/Recoil_RecoilValue');
const {
  getRecoilValueAsLoadable,
  isRecoilValue,
} = require('../core/Recoil_RecoilValueInterface');
const deepFreezeValue = require('../util/Recoil_deepFreezeValue');
const isPromise = require('../util/Recoil_isPromise');
const nullthrows = require('../util/Recoil_nullthrows');
const {startPerfBlock} = require('../util/Recoil_PerformanceTimings');

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
type DepValues = Map<NodeKey, Loadable<mixed>>;

// flowlint-next-line unclear-type:off
const emptySet: $ReadOnlySet<any> = Object.freeze(new Set());

function cacheKeyFromDepValues(depValues: DepValues): CacheKey {
  const answer = [];
  for (const key of Array.from(depValues.keys()).sort()) {
    const loadable = nullthrows(depValues.get(key));
    answer.push(key);
    answer.push(loadable.contents);
  }
  return answer;
}

const dependencyStack = []; // for detecting circular dependencies.

/* eslint-disable no-redeclare */
declare function selector<T>(
  options: ReadOnlySelectorOptions<T>,
): RecoilValueReadOnly<T>;
declare function selector<T>(
  options: ReadWriteSelectorOptions<T>,
): RecoilState<T>;

function selector<T>(
  options: ReadOnlySelectorOptions<T> | ReadWriteSelectorOptions<T>,
): RecoilValue<T> {
  const {key, get, cacheImplementation_UNSTABLE: cacheImplementation} = options;
  const set = options.set != null ? options.set : undefined; // flow

  let cache: CacheImplementation<Loadable<T>> =
    cacheImplementation ?? cacheWithReferenceEquality();

  function initSelector(store: Store) {
    store.getState().knownSelectors.add(key);
  }

  function putIntoCache(
    store: Store,
    cacheKey: CacheKey,
    loadable: Loadable<T>,
  ) {
    if (loadable.state !== 'loading') {
      // Synchronous result
      if (__DEV__) {
        if (!options.dangerouslyAllowMutability === true) {
          deepFreezeValue(loadable.contents);
        }
      }
    } else {
      // Asynchronous result
      // When the promise resolves, we need to replace the loading state in the
      // cache and fire any external subscriptions to re-render with the new value.
      loadable.contents
        .then((result: $FlowFixMe) => {
          if (__DEV__) {
            if (!options.dangerouslyAllowMutability === true) {
              deepFreezeValue(result);
            }
          }

          // If the value is now resolved, then update the cache with the new value
          cache = cache.set(cacheKey, loadableWithValue(result));

          // TODO Potential optimization: I think this is updating the cache
          // with a cacheKey of the dep when it wasn't ready yet.  We could also
          // theoretically put the result in the cache for a cacheKey with the
          // dep resolved.  If we had some way of figuring out what that cacheKey was..
          // Note that this optimization would change the user visible behavior slightly,
          // see the unit test "useRecoilState - selector catching promise 2".
          // If the user catches and handles pending async dependencies, then returns
          // a promise that resolves when they are available there is a question if
          // the result of that promise should be the value of the selector, or if
          // the selector should re-evaluate when the dependency is available.
          // If the promise returned and the pending dependency resolve at different
          // times, then the behaviour is better defined, as in the unit test,
          // "useRecoilState - selector catching promise and resolving asynchronously"

          // Fire subscriptions to re-render any subscribed components with the new value.
          // The store uses the CURRENT state, not the old state from which
          // this was called.  That state likely doesn't have the subscriptions saved yet.
          store.fireNodeSubscriptions(new Set([key]), 'now');
          return result;
        })
        .catch(error => {
          // TODO Figure out why we are catching promises here versus evaluateSelectorFunction
          // OH, I see why.  Ok, work on this.
          if (isPromise(error)) {
            return error;
          }
          if (__DEV__) {
            if (!options.dangerouslyAllowMutability === true) {
              deepFreezeValue(error);
            }
          }
          // The async value was rejected with an error.  Update the cache with
          // the error and fire subscriptions to re-render.
          cache = cache.set(cacheKey, loadableWithError(error));
          store.fireNodeSubscriptions(new Set([key]), 'now');
          return error;
        });
    }

    cache = cache.set(cacheKey, loadable);
  }

  function getFromCacheOrEvaluate(
    store: Store,
    state: TreeState,
  ): [DependencyMap, Loadable<T>] {
    const dependencyMap: DependencyMap = new Map();

    // First, get the current deps for this selector
    const currentDeps =
      nullthrows(
        store.getState().graphsByVersion.get(state.version),
      ).nodeDeps.get(key) ?? emptySet;
    const depValues: DepValues = new Map(
      Array.from(currentDeps)
        .sort()
        .map(depKey => {
          const [deps, loadable] = getNodeLoadable(store, state, depKey);
          mergeDepsIntoDependencyMap(deps, dependencyMap);
          return [depKey, loadable];
        }),
    );

    // Always cache and evaluate a selector
    // It may provide a result even when not all deps are available.
    const cacheKey = cacheKeyFromDepValues(depValues);
    const cached: Loadable<T> | void = cache.get(cacheKey);

    if (cached != null) {
      return [dependencyMap, cached];
    }

    // Cache miss, compute the value
    const [deps, loadable, newDepValues] = evaluateSelectorFunction(
      store,
      state,
    );

    mergeDepsIntoDependencyMap(deps, dependencyMap);

    // Save result in cache
    const newCacheKey = cacheKeyFromDepValues(newDepValues);
    putIntoCache(store, newCacheKey, loadable);
    return [dependencyMap, loadable];
  }

  function evaluateSelectorFunction(
    store: Store,
    state: TreeState,
  ): [DependencyMap, Loadable<T>, DepValues] {
    const endPerfBlock = startPerfBlock(key);
    const depValues = new Map(); // key -> value for our deps
    const dependencyMap: DependencyMap = new Map(); // node -> nodes, part of overall dep map.

    function getRecoilValue<S>({key: depKey}: RecoilValue<S>): S {
      addToDependencyMap(key, depKey, dependencyMap);
      const [deps, loadable] = getNodeLoadable(store, state, depKey);
      depValues.set(depKey, loadable);
      mergeDepsIntoDependencyMap(deps, dependencyMap);
      if (loadable.state === 'hasValue') {
        return loadable.contents;
      } else {
        throw loadable.contents; // Promise or error
      }
    }

    try {
      // The big moment!
      const output = get({get: getRecoilValue});
      // TODO Allow user to also return Loadables for improved composability
      const result = isRecoilValue(output) ? getRecoilValue(output) : output;
      const loadable: Loadable<T> = !isPromise(result)
        ? // The selector returned a simple synchronous value, so let's use it!
          (endPerfBlock(), loadableWithValue<T>(result))
        : // The user returned a promise for an asynchronous selector.  This will
          // resolve to the proper value of the selector when available.
          loadableWithPromise<T>((result: $FlowFixMe).finally(endPerfBlock));
      return [dependencyMap, loadable, depValues];
    } catch (errorOrDepPromise) {
      const isP = errorOrDepPromise.then !== undefined;
      const loadable = !isP
        ? // There was a synchronous error in the evaluation
          (endPerfBlock(), loadableWithError(errorOrDepPromise))
        : // If an asynchronous dependency was not ready, then return a promise that
          // will resolve when we finally do have a real value or error for the selector.
          loadableWithPromise(
            errorOrDepPromise
              .then(() => {
                // Now that its deps are ready, re-evaluate the selector (and
                // record any newly-discovered dependencies in the Store):
                const loadable = getRecoilValueAsLoadable(
                  store,
                  new AbstractRecoilValue(key),
                );
                if (loadable.state === 'hasError') {
                  throw loadable.contents;
                }
                // Either the re-try provided a value, which we will use, or it
                // got blocked again.  In that case this is a promise and we'll try again.
                return loadable.contents;
              })
              .finally(endPerfBlock),
          );

      return [dependencyMap, loadable, depValues];
    }
  }

  function detectCircularDependencies(fn) {
    if (dependencyStack.includes(key)) {
      const message = `Recoil selector has circular dependencies: ${dependencyStack
        .slice(dependencyStack.indexOf(key))
        .join(' \u2192 ')}`;
      return [new Map(), loadableWithError(new Error(message))];
    }
    dependencyStack.push(key);
    try {
      return fn();
    } finally {
      dependencyStack.pop();
    }
  }

  function myGet(store: Store, state: TreeState): [DependencyMap, Loadable<T>] {
    initSelector(store);
    // TODO memoize a value if no deps have changed to avoid a cache lookup
    // Lookup the node value in the cache.  If not there, then compute
    // the value and update the state with any changed node subscriptions.
    if (__DEV__) {
      return detectCircularDependencies(() =>
        getFromCacheOrEvaluate(store, state),
      );
    } else {
      return getFromCacheOrEvaluate(store, state);
    }
  }

  if (set != null) {
    function mySet(store, state, newValue): [DependencyMap, AtomValues] {
      initSelector(store);

      const dependencyMap: DependencyMap = new Map();
      const writes: AtomValues = new Map();

      function getRecoilValue<S>({key}: RecoilValue<S>): S {
        const [deps, loadable] = getNodeLoadable(store, state, key);
        mergeDepsIntoDependencyMap(deps, dependencyMap);
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
        const [deps, upstreamWrites] = setNodeValue(
          store,
          state,
          recoilState.key,
          newValue,
        );
        mergeDepsIntoDependencyMap(deps, dependencyMap);
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
