/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * A type that represents a value that may or may not be loaded. It differs from
 * LoadObject in that the `loading` state has a Promise that is meant to resolve
 * when the value is available (but as with LoadObject, an individual Loadable
 * is a value type and is not mutated when the status of a request changes).
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */
'use strict';

import type {NodeKey} from '../core/Recoil_Keys';

const isPromise = require('../util/Recoil_isPromise');
const nullthrows = require('../util/Recoil_nullthrows');

const TYPE_CHECK_COOKIE = 27495866187;

// TODO Convert Loadable to a Class to allow for runtime type detection.
// Containing static factories of withValue(), withError(), withPromise(), and all()

export type ResolvedLoadablePromiseInfo<+T> = $ReadOnly<{
  __value: T,
  __key?: NodeKey,
}>;

class Canceled {}
const CANCELED: Canceled = new Canceled();

export type LoadablePromise<+T> = Promise<
  ResolvedLoadablePromiseInfo<T> | Canceled,
>;

type Accessors<+T> = $ReadOnly<{
  // Attempt to get the value.
  // If there's an error, throw an error.  If it's still loading, throw a Promise
  // This is useful for composing with React Suspense or in a Recoil Selector.
  getValue: () => T,
  toPromise: () => Promise<T>,

  // Convenience accessors
  valueOrThrow: () => T,
  errorOrThrow: () => mixed,
  promiseOrThrow: () => Promise<T>,

  is: (Loadable<mixed>) => boolean,

  map: <T, S>(map: (T) => Loadable<S> | Promise<S> | S) => Loadable<S>,
}>;

type ValueAccessors<+T> = $ReadOnly<{
  ...Accessors<T>,
  valueMaybe: () => T,
  errorMaybe: () => void,
  promiseMaybe: () => void,
}>;

type ErrorAccessors<+T> = $ReadOnly<{
  ...Accessors<T>,
  valueMaybe: () => void,
  errorMaybe: () => mixed,
  promiseMaybe: () => void,
}>;

type LoadingAccessors<+T> = $ReadOnly<{
  ...Accessors<T>,
  valueMaybe: () => void,
  errorMaybe: () => void,
  promiseMaybe: () => Promise<T>,
}>;

type ValueLoadable<+T> = $ReadOnly<{
  __loadable: number,
  state: 'hasValue',
  contents: T,
  ...ValueAccessors<T>,
}>;

type ErrorLoadable<+T> = $ReadOnly<{
  __loadable: number,
  state: 'hasError',
  contents: mixed,
  ...ErrorAccessors<T>,
}>;

type LoadingLoadable<+T> = $ReadOnly<{
  __loadable: number,
  state: 'loading',
  contents: LoadablePromise<T>,
  ...LoadingAccessors<T>,
}>;

export type Loadable<+T> =
  | ValueLoadable<T>
  | ErrorLoadable<T>
  | LoadingLoadable<T>;

const loadableAccessors = {
  valueMaybe() {
    return undefined;
  },

  valueOrThrow() {
    const error = new Error(
      // $FlowFixMe[object-this-reference]
      `Loadable expected value, but in "${this.state}" state`,
    );
    // V8 keeps closures alive until stack is accessed, this prevents a memory leak
    error.stack;
    throw error;
  },

  errorMaybe() {
    return undefined;
  },

  errorOrThrow() {
    const error = new Error(
      // $FlowFixMe[object-this-reference]
      `Loadable expected error, but in "${this.state}" state`,
    );
    // V8 keeps closures alive until stack is accessed, this prevents a memory leak
    error.stack;
    throw error;
  },

  promiseMaybe() {
    return undefined;
  },

  promiseOrThrow() {
    const error = new Error(
      // $FlowFixMe[object-this-reference]
      `Loadable expected promise, but in "${this.state}" state`,
    );
    // V8 keeps closures alive until stack is accessed, this prevents a memory leak
    error.stack;
    throw error;
  },

  is(other: Loadable<mixed>): boolean {
    // $FlowFixMe[object-this-reference]
    return other.state === this.state && other.contents === this.contents;
  },

  map<T, S>(map: T => Promise<S> | Loadable<S> | S): Loadable<S> {
    // $FlowFixMe[object-this-reference]
    if (this.state === 'hasError') {
      // $FlowFixMe[object-this-reference]
      return this;
    }
    // $FlowFixMe[object-this-reference]
    if (this.state === 'hasValue') {
      try {
        // $FlowFixMe[object-this-reference]
        const next = map(this.contents);
        return isPromise(next)
          ? loadableWithPromise(next.then(value => ({__value: value})))
          : isLoadable(next)
          ? // TODO Fix Flow typing for isLoadable() %check
            (next: any) // flowlint-line unclear-type:off
          : loadableWithValue((next: any)); // flowlint-line unclear-type:off
      } catch (e) {
        return isPromise(e)
          ? // If we "suspended", then try again.
            // errors and subsequent retries will be handled in 'loading' case
            // $FlowFixMe[object-this-reference]
            loadableWithPromise(e.next(() => map(this.contents)))
          : loadableWithError(e);
      }
    }
    // $FlowFixMe[object-this-reference]
    if (this.state === 'loading') {
      return loadableWithPromise(
        // $FlowFixMe[object-this-reference]
        this.contents
          .then(value => {
            const next = map(value.__value);
            if (isLoadable(next)) {
              const nextLoadable: Loadable<S> = (next: any); // flowlint-line unclear-type:off
              switch (nextLoadable.state) {
                case 'hasValue':
                  return {__value: nextLoadable.contents};
                case 'hasError':
                  throw nextLoadable.contents;
                case 'loading':
                  return nextLoadable.contents;
              }
            }
            return {__value: next};
          })
          .catch(e => {
            if (isPromise(e)) {
              // we were "suspended," try again
              // $FlowFixMe[object-this-reference]
              return e.then(() => map(this.contents));
            }
            throw e;
          }),
      );
    }
    const error = new Error('Invalid Loadable state');
    // V8 keeps closures alive until stack is accessed, this prevents a memory leak
    error.stack;
    throw error;
  },
};

function loadableWithValue<T>(value: T): ValueLoadable<T> {
  // Build objects this way since Flow doesn't support disjoint unions for class properties
  return Object.freeze({
    __loadable: TYPE_CHECK_COOKIE,
    state: 'hasValue',
    contents: value,
    ...loadableAccessors,
    getValue() {
      return this.contents;
    },
    toPromise() {
      return Promise.resolve(this.contents);
    },
    valueMaybe() {
      return this.contents;
    },
    valueOrThrow() {
      return this.contents;
    },
  });
}

function loadableWithError<T>(error: mixed): ErrorLoadable<T> {
  return Object.freeze({
    __loadable: TYPE_CHECK_COOKIE,
    state: 'hasError',
    contents: error,
    ...loadableAccessors,
    getValue() {
      throw this.contents;
    },
    toPromise() {
      return Promise.reject(this.contents);
    },
    errorMaybe() {
      return this.contents;
    },
    errorOrThrow() {
      return this.contents;
    },
  });
}

// TODO Probably need to clean-up this API to accept `Promise<T>`
// with an alternative params or mechanism for internal key proxy.
function loadableWithPromise<T>(
  promise: LoadablePromise<T>,
): LoadingLoadable<T> {
  return Object.freeze({
    __loadable: TYPE_CHECK_COOKIE,
    state: 'loading',
    contents: promise,
    ...loadableAccessors,
    getValue() {
      throw this.contents.then(({__value}) => __value);
    },
    toPromise() {
      return this.contents.then(({__value}) => __value);
    },
    promiseMaybe() {
      return this.contents.then(({__value}) => __value);
    },
    promiseOrThrow() {
      return this.contents.then(({__value}) => __value);
    },
  });
}

function loadableLoading<T>(): Loadable<T> {
  return loadableWithPromise(new Promise(() => {}));
}

type UnwrapLoadables<Loadables> = $TupleMap<Loadables, <T>(Loadable<T>) => T>;

function loadableAll<Inputs: $ReadOnlyArray<Loadable<mixed>>>(
  inputs: Inputs,
): Loadable<UnwrapLoadables<Inputs>> {
  return inputs.every(i => i.state === 'hasValue')
    ? loadableWithValue(inputs.map(i => i.contents))
    : inputs.some(i => i.state === 'hasError')
    ? loadableWithError(
        nullthrows(
          inputs.find(i => i.state === 'hasError'),
          'Invalid loadable passed to loadableAll',
        ).contents,
      )
    : loadableWithPromise(
        Promise.all(inputs.map(i => i.contents)).then(value => ({
          __value: value,
        })),
      );
}

// TODO Actually get this to work with Flow
function isLoadable(x: mixed): boolean %checks {
  return (x: any).__loadable == TYPE_CHECK_COOKIE; // flowlint-line unclear-type:off
}

module.exports = {
  loadableWithValue,
  loadableWithError,
  loadableWithPromise,
  loadableLoading,
  loadableAll,
  isLoadable,
  Canceled,
  CANCELED,
};
