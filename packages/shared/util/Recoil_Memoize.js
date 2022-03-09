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

/**
 * Caches a function's results based on the key returned by the passed
 * hashFunction.
 */
function memoizeWithArgsHash<TArgs: $ReadOnlyArray<mixed>, TReturn>(
  fn: (...TArgs) => TReturn,
  hashFunction: (...TArgs) => string,
): (...TArgs) => TReturn {
  let cache;
  const memoizedFn: (...TArgs) => TReturn = (...args: TArgs): TReturn => {
    if (!cache) {
      cache = ({}: {[string]: TReturn});
    }

    const key = hashFunction(...args);
    if (!Object.hasOwnProperty.call(cache, key)) {
      cache[key] = fn.apply(this, args);
    }
    return cache[key];
  };

  return memoizedFn;
}

/**
 * Caches a function's results based on a comparison of the arguments.
 * Only caches the last return of the function.
 * Defaults to reference equality
 */
function memoizeOneWithArgsHash<TArgs: $ReadOnlyArray<mixed>, TReturn>(
  fn: (...TArgs) => TReturn,
  hashFunction: (...TArgs) => string,
): (...TArgs) => TReturn {
  let lastKey: ?string;
  let lastResult: TReturn;

  // breaking cache when arguments change
  const memoizedFn: (...TArgs) => TReturn = (...args: TArgs): TReturn => {
    const key = hashFunction(...args);
    if (lastKey === key) {
      return lastResult;
    }

    lastKey = key;
    lastResult = fn.apply(this, args);
    return lastResult;
  };

  return memoizedFn;
}

/**
 * Caches a function's results based on a comparison of the arguments.
 * Only caches the last return of the function.
 * Defaults to reference equality
 */
function memoizeOneWithArgsHashAndInvalidation<
  TArgs: $ReadOnlyArray<mixed>,
  TReturn,
>(
  fn: (...TArgs) => TReturn,
  hashFunction: (...TArgs) => string,
): [(...TArgs) => TReturn, () => void] {
  let lastKey: ?string;
  let lastResult: TReturn;

  // breaking cache when arguments change
  const memoizedFn: (...TArgs) => TReturn = (...args: TArgs): TReturn => {
    const key = hashFunction(...args);
    if (lastKey === key) {
      return lastResult;
    }

    lastKey = key;
    lastResult = fn.apply(this, args);
    return lastResult;
  };

  const invalidate = () => {
    lastKey = null;
  };

  return [memoizedFn, invalidate];
}

module.exports = {
  memoizeWithArgsHash,
  memoizeOneWithArgsHash,
  memoizeOneWithArgsHashAndInvalidation,
};
