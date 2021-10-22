/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * refine: type-refinement combinator library for checking mixed values
 * see wiki for more info: https://fburl.com/wiki/14q16qqy
 *
 * @emails oncall+monitoring_interfaces
 * @flow strict
 * @format
 */
'use strict';

import type {Checker} from './Refine_Checkers';

const {Path, compose, failure, success} = require('./Refine_Checkers');

// Check that the provided value is a plain object and not an instance of some
// other container type, built-in, or user class.
function isPlainObject<T: {...}>(value: T) {
  // $FlowIssue[method-unbinding]
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/**
 * checker to assert if a mixed value is an array of
 * values determined by a provided checker
 */
function array<V>(valueChecker: Checker<V>): Checker<$ReadOnlyArray<V>> {
  return (value, path = new Path()) => {
    if (!Array.isArray(value)) {
      return failure('value is not an array', path);
    }

    const len = value.length;
    const out = new Array(len);
    const warnings = [];

    for (let i = 0; i < len; i++) {
      const element = value[i];
      const result = valueChecker(element, path.extend(`[${i}]`));
      if (result.type === 'failure') {
        return failure(result.message, result.path);
      }
      out[i] = result.value;
      if (result.warnings.length !== 0) {
        warnings.push(...result.warnings);
      }
    }

    return success(out, warnings);
  };
}

/**
 * checker to assert if a mixed value is a tuple of values
 * determined by provided checkers. Extra entries are ignored.
 *
 * Example:
 * ```jsx
 * const checker = tuple( number(), string() );
 * ```
 *
 * Example with optional trailing entry:
 * ```jsx
 * const checker = tuple( number(), voidable(string()));
 * ```
 */
function tuple<Checkers: $ReadOnlyArray<Checker<mixed>>>(
  ...checkers: Checkers
): Checker<$TupleMap<Checkers, <T>(Checker<T>) => T>> {
  return (value, path = new Path()) => {
    if (!Array.isArray(value)) {
      return failure('value is not an array', path);
    }
    const out = new Array(checkers.length);
    const warnings = [];
    for (const [i, checker] of checkers.entries()) {
      const result = checker(value[i], path.extend(`[${i}]`));
      if (result.type === 'failure') {
        return failure(result.message, result.path);
      }
      out[i] = result.value;
      if (result.warnings.length !== 0) {
        warnings.push(...result.warnings);
      }
    }
    return success(out, warnings);
  };
}

/**
 * checker to assert if a mixed value is a string-keyed dict of
 * values determined by a provided checker
 */
function dict<V>(
  valueChecker: Checker<V>,
): Checker<$ReadOnly<{[key: string]: V}>> {
  return (value, path = new Path()) => {
    if (typeof value !== 'object' || value === null || !isPlainObject(value)) {
      return failure('value is not an object', path);
    }

    const out: {[key: string]: V} = {};
    const warnings = [];
    for (const [key, element] of Object.entries(value)) {
      const result = valueChecker(element, path.extend(`.${key}`));

      if (result.type === 'failure') {
        return failure(result.message, result.path);
      }

      out[key] = result.value;
      if (result.warnings.length !== 0) {
        warnings.push(...result.warnings);
      }
    }

    return success(out, warnings);
  };
}

/**
 * checker to assert if a mixed value is a fixed-property object,
 * with key-value pairs determined by a provided object of checkers.
 * Any extra properties in the input object values are ignored.
 * Class instances are not supported, use the custom() checker for those.
 *
 * Example:
 * ```jsx
 * const myObject = object({
 *   name: string(),
 *   job: object({
 *     years: number(),
 *     title: string(),
 *   }),
 * });
 * ```
 *
 * Properties can be optional using `voidable()` or have default values
 * using `withDefault()`:
 * ```jsx
 * const customer = object({
 *   name: string(),
 *   reference: voidable(string()),
 *   method: withDefault(string(), 'email'),
 * });
 * ```
 */
function object<Checkers: $ReadOnly<{...}>>(
  checkers: Checkers,
): Checker<$ReadOnly<$ObjMap<Checkers, <T>(c: Checker<T>) => T>>> {
  const checkerProperties: $ReadOnlyArray<string> = Object.keys(checkers);

  return (value, path = new Path()) => {
    if (typeof value !== 'object' || value === null || !isPlainObject(value)) {
      return failure('value is not an object', path);
    }

    const out: {[string]: mixed} = {};
    const warnings = [];

    for (const key of checkerProperties) {
      const check: Checker<mixed> = checkers[key];
      const element: mixed = value.hasOwnProperty(key) ? value[key] : undefined;
      const result = check(element, path.extend(`.${key}`));

      if (result.type === 'failure') {
        return failure(result.message, result.path);
      }

      out[key] = result.value;
      if (result.warnings.length !== 0) {
        warnings.push(...result.warnings);
      }
    }

    return success(out, warnings);
  };
}

/**
 * checker to assert if a mixed value is a Set type
 */
function set<T>(checker: Checker<T>): Checker<$ReadOnlySet<T>> {
  return (value, path = new Path()) => {
    if (!(value instanceof Set)) {
      return failure('value is not a Set', path);
    }

    const out = new Set();
    const warnings = [];
    for (const item of value) {
      const result = checker(item, path.extend('[]'));
      if (result.type === 'failure') {
        return failure(result.message, result.path);
      }
      out.add(result.value);
      if (result.warnings.length) {
        warnings.push(...result.warnings);
      }
    }
    return success(out, warnings);
  };
}

/**
 * checker to assert if a mixed value is a Map.
 */
function map<K, V>(
  keyChecker: Checker<K>,
  valueChecker: Checker<V>,
): Checker<$ReadOnlyMap<K, V>> {
  return (value, path = new Path()) => {
    if (!(value instanceof Map)) {
      return failure('value is not a Map', path);
    }

    const out = new Map();
    const warnings = [];
    for (const [k, v] of value.entries()) {
      const keyResult = keyChecker(k, path.extend(`[${k}] key`));
      if (keyResult.type === 'failure') {
        return failure(keyResult.message, keyResult.path);
      }
      const valueResult = valueChecker(v, path.extend(`[${k}]`));
      if (valueResult.type === 'failure') {
        return failure(valueResult.message, valueResult.path);
      }
      out.set(k, v);
      warnings.push(...keyResult.warnings, ...valueResult.warnings);
    }
    return success(out, warnings);
  };
}

/**
 * identical to `array()` except the resulting value is a writable flow type.
 */
function writableArray<V>(valueChecker: Checker<V>): Checker<Array<V>> {
  return compose(array(valueChecker), ({value, warnings}) =>
    success([...value], warnings),
  );
}

/**
 * identical to `dict()` except the resulting value is a writable flow type.
 */
function writableDict<V>(
  valueChecker: Checker<V>,
): Checker<{[key: string]: V}> {
  return compose(dict(valueChecker), ({value, warnings}) =>
    success({...value}, warnings),
  );
}

/**
 * identical to `object()` except the resulting value is a writable flow type.
 */
function writableObject<Checkers: $ReadOnly<{...}>>(
  checkers: Checkers,
): Checker<$ObjMap<Checkers, <T>(c: Checker<T>) => T>> {
  return compose(object(checkers), ({value, warnings}) =>
    success({...value}, warnings),
  );
}

module.exports = {
  array,
  tuple,
  object,
  dict,
  set,
  map,
  writableArray,
  writableDict,
  writableObject,
};
