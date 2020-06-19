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
import type {CacheImplementation} from '../caches/Recoil_Cache';
import type {DefaultValue} from '../core/Recoil_Node';
import type {
  RecoilState,
  RecoilValue,
  RecoilValueReadOnly,
} from '../core/Recoil_RecoilValue';
import type {
  GetRecoilValue,
  ResetRecoilState,
  SetRecoilState,
} from './Recoil_selector';

const cacheWithValueEquality = require('../caches/Recoil_cacheWithValueEquality');
const stableStringify = require('../util/Recoil_stableStringify');
const selector = require('./Recoil_selector');

// Keep in mind the parameter needs to be serializable as a cahche key
// using Recoil_stableStringify
export type Parameter =
  | void
  | null
  | boolean
  | number
  | string
  | $ReadOnly<{...}>
  | $ReadOnlyArray<mixed>;

type ReadOnlySelectorFamilyOptions<T, P: Parameter> = $ReadOnly<{
  key: string,
  get: P => ({get: GetRecoilValue}) => Promise<T> | RecoilValue<T> | T,
  cacheImplementation_UNSTABLE?: () => CacheImplementation<Loadable<T>>,
  cacheImplementationForParams_UNSTABLE?: () => CacheImplementation<
    RecoilValue<T>,
  >,
  dangerouslyAllowMutability?: boolean,
}>;

export type ReadWriteSelectorFamilyOptions<T, P: Parameter> = $ReadOnly<{
  ...ReadOnlySelectorFamilyOptions<T, P>,
  set: P => (
    {set: SetRecoilState, get: GetRecoilValue, reset: ResetRecoilState},
    newValue: T | DefaultValue,
  ) => void,
}>;

export type SelectorFamilyOptions<T, P> =
  | ReadOnlySelectorFamilyOptions<T, P>
  | ReadWriteSelectorFamilyOptions<T, P>;

// Add a unique index to each selector in case the cache implementation allows
// duplicate keys based on equivalent stringified parameters
let nextIndex = 0;

/* eslint-disable no-redeclare */
declare function selectorFamily<T, Params: Parameter>(
  options: ReadOnlySelectorFamilyOptions<T, Params>,
): Params => RecoilValueReadOnly<T>;
declare function selectorFamily<T, Params: Parameter>(
  options: ReadWriteSelectorFamilyOptions<T, Params>,
): Params => RecoilState<T>;

// Return a function that returns members of a family of selectors of the same type
// E.g.,
//
// const s = selectorFamily(...);
// s({a: 1}) => a selector
// s({a: 2}) => a different selector
//
// By default, the selectors are distinguished by distinct values of the
// parameter based on value equality, not reference equality.  This allows using
// object literals or other equivalent objects at callsites to not create
// duplicate cache entries.  This behavior may be overridden with the
// cacheImplementationForParams option.
function selectorFamily<T, Params: Parameter>(
  options:
    | ReadOnlySelectorFamilyOptions<T, Params>
    | ReadWriteSelectorFamilyOptions<T, Params>,
): Params => RecoilValue<T> {
  let selectorCache =
    options.cacheImplementationForParams_UNSTABLE?.() ??
    cacheWithValueEquality();

  return (params: Params) => {
    const cachedSelector = selectorCache.get(params);
    if (cachedSelector != null) {
      return cachedSelector;
    }

    const myKey = `${options.key}__selectorFamily/${stableStringify(params, {
      // It is possible to use functions in parameters if the user uses
      // a cache with reference equality thanks to the incrementing index.
      allowFunctions: true,
    }) ?? 'void'}/${nextIndex++}`; // Append index in case values serialize to the same key string
    const myGet = callbacks => options.get(params)(callbacks);
    const myCacheImplementation = options.cacheImplementation_UNSTABLE?.();

    let newSelector;
    if (options.set != null) {
      const set = options.set;
      const mySet = (callbacks, newValue) => set(params)(callbacks, newValue);
      newSelector = selector<T>({
        key: myKey,
        get: myGet,
        set: mySet,
        cacheImplementation_UNSTABLE: myCacheImplementation,
        dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      });
    } else {
      newSelector = selector<T>({
        key: myKey,
        get: myGet,
        cacheImplementation_UNSTABLE: myCacheImplementation,
        dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      });
    }
    selectorCache = selectorCache.set(params, newSelector);
    return newSelector;
  };
}
/* eslint-enable no-redeclare */

module.exports = selectorFamily;
