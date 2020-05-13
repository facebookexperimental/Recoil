/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from 'Recoil_Loadable';
import type {RecoilValue, RecoilValueReadOnly} from 'Recoil_RecoilValue';

const {
  loadableWithError,
  loadableWithPromise,
  loadableWithValue,
} = require('Recoil_Loadable');
const selectorFamily = require('Recoil_selectorFamily');

const gkx = require('gkx');
const isPromise = require('isPromise');

/////////////////
//  TRUTH TABLE
/////////////////
// Dependencies        waitForNone         waitForAny        waitForAll
//  [loading, loading]  [Promise, Promise]  Promise           Promise
//  [value, loading]    [value, Promise]    [value, Promise]  Promise
//  [value, value]      [value, value]      [value, value]    [value, value]
//
//  [error, loading]    [Error, Promise]    Promise           Error
//  [error, error]      [Error, Error]      Error             Error
//  [value, error]      [value, Error]      [value, Error]    Error

// Issue parallel requests for all dependencies and return the current
// status if they have results, have some error, or are still pending.
function concurrentRequests(getRecoilValue, deps) {
  const results = Array(deps.length).fill(undefined);
  const exceptions = Array(deps.length).fill(undefined);
  for (const [i, dep] of deps.entries()) {
    try {
      results[i] = getRecoilValue(dep);
    } catch (e) {
      // exceptions can either be Promises of pending results or real errors
      exceptions[i] = e;
    }
  }
  return [results, exceptions];
}

function isError(exp) {
  return exp != null && !isPromise(exp);
}

function unwrapDependencies(dependencies): $ReadOnlyArray<RecoilValue<mixed>> {
  return Array.isArray(dependencies)
    ? dependencies
    : Object.getOwnPropertyNames(dependencies).map(key => dependencies[key]);
}

function getValueFromLoadablePromiseResult(result) {
  if (result.hasOwnProperty('value')) {
    return result.value;
  }

  return result;
}

function wrapResults(dependencies, results) {
  return Array.isArray(dependencies)
    ? results
    : // Object.getOwnPropertyNames() has consistent key ordering with ES6
      Object.getOwnPropertyNames(dependencies).reduce(
        (out, key, idx) => ({...out, [key]: results[idx]}),
        {},
      );
}

function wrapLoadables(dependencies, results, exceptions) {
  const output = exceptions.map((exception, idx) =>
    exception == null
      ? loadableWithValue(results[idx])
      : isPromise(exception)
      ? loadableWithPromise(exception)
      : loadableWithError(exception),
  );
  return wrapResults(dependencies, output);
}

// Selector that requests all dependencies in parallel and immediatly returns
// current results without waiting.
const waitForNone: <
  RecoilValues:
    | $ReadOnlyArray<RecoilValueReadOnly<mixed>>
    | $ReadOnly<{[string]: RecoilValueReadOnly<mixed>, ...}>,
>(
  RecoilValues,
) => RecoilValueReadOnly<
  $ReadOnlyArray<Loadable<mixed>> | $ReadOnly<{[string]: Loadable<mixed>, ...}>,
> = selectorFamily({
  key: '__waitForNone',
  get: dependencies => ({get}) => {
    // Issue requests for all dependencies in parallel.
    const deps = unwrapDependencies(dependencies);
    const [results, exceptions] = concurrentRequests(get, deps);

    // Always return the current status of the results; never block.
    return wrapLoadables(dependencies, results, exceptions);
  },
});

// Selector that requests all dependencies in parallel and waits for at least
// one to be available before returning results.  It will only error if all
// dependencies have errors.
const waitForAny: <
  RecoilValues:
    | $ReadOnlyArray<RecoilValueReadOnly<mixed>>
    | $ReadOnly<{[string]: RecoilValueReadOnly<mixed>, ...}>,
>(
  RecoilValues,
) => RecoilValueReadOnly<
  $ReadOnlyArray<mixed> | $ReadOnly<{[string]: mixed, ...}>,
> = selectorFamily({
  key: '__waitForAny',
  get: dependencies => ({get}) => {
    // Issue requests for all dependencies in parallel.
    // Exceptions can either be Promises of pending results or real errors
    const deps = unwrapDependencies(dependencies);
    const [results, exceptions] = concurrentRequests(get, deps);

    // If any results are available, return the current status
    if (exceptions.some(exp => exp == null)) {
      return wrapLoadables(dependencies, results, exceptions);
    }

    // Since we are waiting for any results, only throw an error if all
    // dependencies have an error.  Then, throw the first one.
    if (exceptions.every(isError)) {
      throw exceptions.find(isError);
    }

    if (gkx('recoil_async_selector_refactor')) {
      // Otherwise, return a promise that will resolve when the next result is
      // available, whichever one happens to be next.  But, if all pending
      // dependencies end up with errors, then reject the promise.
      return new Promise((resolve, reject) => {
        for (const [i, exp] of exceptions.entries()) {
          if (isPromise(exp)) {
            exp
              .then(result => {
                results[i] = getValueFromLoadablePromiseResult(result);
                exceptions[i] = null;
                resolve(wrapLoadables(dependencies, results, exceptions));
              })
              .catch(error => {
                exceptions[i] = error;
                if (exceptions.every(isError)) {
                  reject(exceptions[0]);
                }
              });
          }
        }
      });
    } else {
      throw new Promise((resolve, reject) => {
        for (const [i, exp] of exceptions.entries()) {
          if (isPromise(exp)) {
            exp
              .then(result => {
                results[i] = result;
                exceptions[i] = null;
                resolve(wrapLoadables(dependencies, results, exceptions));
              })
              .catch(error => {
                exceptions[i] = error;
                if (exceptions.every(isError)) {
                  reject(exceptions[0]);
                }
              });
          }
        }
      });
    }
  },
});

// Selector that requests all dependencies in parallel and waits for all to be
// available before returning a value.  It will error if any dependencies error.
const waitForAll: <
  RecoilValues:
    | $ReadOnlyArray<RecoilValueReadOnly<mixed>>
    | $ReadOnly<{[string]: RecoilValueReadOnly<mixed>, ...}>,
>(
  RecoilValues,
) => RecoilValueReadOnly<
  $ReadOnlyArray<mixed> | $ReadOnly<{[string]: mixed, ...}>,
> = selectorFamily({
  key: '__waitForAll',
  get: dependencies => ({get}) => {
    // Issue requests for all dependencies in parallel.
    // Exceptions can either be Promises of pending results or real errors
    const deps = unwrapDependencies(dependencies);
    const [results, exceptions] = concurrentRequests(get, deps);

    // If all results are available, return the results
    if (exceptions.every(exp => exp == null)) {
      return wrapResults(dependencies, results);
    }

    // If we have any errors, throw the first error
    const error = exceptions.find(isError);
    if (error != null) {
      throw error;
    }

    if (gkx('recoil_async_selector_refactor')) {
      // Otherwise, return a promise that will resolve when all results are available
      return Promise.all(exceptions).then(results =>
        wrapResults(
          dependencies,
          results.map(getValueFromLoadablePromiseResult),
        ),
      );
    } else {
      throw Promise.all(exceptions).then(results =>
        wrapResults(dependencies, results),
      );
    }
  },
});

const noWait: (
  RecoilValue<mixed>,
) => RecoilValueReadOnly<Loadable<mixed>> = selectorFamily({
  key: '__noWait',
  get: dependency => ({get}) => {
    try {
      return loadableWithValue(get(dependency));
    } catch (exception) {
      return isPromise(exception)
        ? loadableWithPromise(exception)
        : loadableWithError(exception);
    }
  },
});

module.exports = {
  waitForNone,
  waitForAny,
  waitForAll,
  noWait,
};
