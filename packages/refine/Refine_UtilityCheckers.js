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

import type {Checker, CheckResult} from './Refine_Checkers';

const {Path, compose, failure, success} = require('./Refine_Checkers');

/**
 * Cast the type of a value after passing a given checker
 *
 * For example:
 *
 * ```javascript
 * import {string, asType} from 'refine';
 *
 * opaque type ID = string;
 *
 * const IDChecker: Checker<ID> = asType(string(), s => (s: ID));
 * ```
 */
function asType<A, B>(checker: Checker<A>, cast: A => B): Checker<B> {
  return compose(checker, ({value, warnings}) =>
    success(cast(value), warnings),
  );
}

/**
 * checker which asserts the value matches
 * at least one of the two provided checkers
 */
function or<A, B>(aChecker: Checker<A>, bChecker: Checker<B>): Checker<A | B> {
  return (value, path = new Path()) => {
    const a = aChecker(value, path);
    if (a.type === 'success') {
      return success(a.value, a.warnings);
    }

    const b = bChecker(value, path);
    if (b.type === 'success') {
      return success(b.value, b.warnings);
    }

    return failure('value did not match any types in or()', path);
  };
}

/**
 * checker which asserts the value matches
 * at least one of the provided checkers
 *
 * NOTE: the reason `union` and `or` both exist is that there is a bug
 *       within flow that prevents extracting the type from `union` without
 *       annotation -- see https://fburl.com/gz7u6401
 */
function union<V>(...checkers: $ReadOnlyArray<Checker<V>>): Checker<V> {
  return (value, path = new Path()) => {
    for (const checker of checkers) {
      const result = checker(value, path);
      if (result.type === 'success') {
        return success(result.value, result.warnings);
      }
    }

    return failure('value did not match any types in union', path);
  };
}

/**
 * Provide a set of checkers to check in sequence to use the first match.
 * This is similar to union(), but all checkers must have the same type.
 *
 * This can be helpful for supporting backward compatibility.  For example the
 * following loads a string type, but can also convert from a number as the
 * previous version or pull from an object as an even older version:
 *
 * ```jsx
 * const backwardCompatibilityChecker: Checker<string> = match(
 *   string(),
 *   asType(number(), num => `${num}`),
 *   asType(object({num: number()}), obj => `${obj.num}`),
 * );
 * ```
 */
function match<T>(...checkers: $ReadOnlyArray<Checker<T>>): Checker<T> {
  return union(...checkers);
}

/**
 * wraps a given checker, making the valid value nullable
 *
 * By default, a value passed to nullable must match the checker spec exactly
 * when it is not null, or it will fail.
 *
 * passing the `nullWithWarningWhenInvalid` enables gracefully handling invalid
 * values that are less important -- if the provided checker is invalid,
 * the new checker will return null.
 *
 * For example:
 *
 * ```javascript
 * import {nullable, record, string} from 'refine';
 *
 * const Options = object({
 *   // this must be a non-null string,
 *   // or Options is not valid
 *   filename: string(),
 *
 *   // if this field is not a string,
 *   // it will be null and Options will pass the checker
 *   description: nullable(string(), {
 *     nullWithWarningWhenInvalid: true,
 *   })
 * })
 *
 * const result = Options({filename: 'test', description: 1});
 *
 * invariant(result.type === 'success');
 * invariant(result.value.description === null);
 * invariant(result.warnings.length === 1); // there will be a warning
 * ```
 */
function nullable<T>(
  checker: Checker<T>,
  options?: $ReadOnly<{
    // if this is true, the checker will not fail
    // validation if an invalid value is provided, instead
    // returning null and including a warning as to the invalid type.
    nullWithWarningWhenInvalid?: boolean,
  }>,
): Checker<?T> {
  const {nullWithWarningWhenInvalid = false} = options ?? {};

  return (value, parentPath = new Path()): CheckResult<?T> => {
    if (value == null) {
      return success(value, []);
    }

    const result = checker(value, parentPath);
    if (result.type === 'success') {
      return success(result.value, result.warnings);
    }

    // if this is enabled, "succeed" the checker with a warning
    // if the non-null value does not match expectation
    if (nullWithWarningWhenInvalid) {
      return success(null, [result]);
    }

    const {message, path} = result;
    return failure(message, path);
  };
}

/**
 * wraps a given checker, making the valid value voidable
 *
 * By default, a value passed to voidable must match the checker spec exactly
 * when it is not undefined, or it will fail.
 *
 * passing the `undefinedWithWarningWhenInvalid` enables gracefully handling invalid
 * values that are less important -- if the provided checker is invalid,
 * the new checker will return undefined.
 *
 * For example:
 *
 * ```javascript
 * import {voidable, record, string} from 'refine';
 *
 * const Options = object({
 *   // this must be a string, or Options is not valid
 *   filename: string(),
 *
 *   // this must be a string or undefined,
 *   // or Options is not valid
 *   displayName: voidable(string()),
 *
 *   // if this field is not a string,
 *   // it will be undefined and Options will pass the checker
 *   description: voidable(string(), {
 *     undefinedWithWarningWhenInvalid: true,
 *   })
 * })
 *
 * const result = Options({filename: 'test', description: 1});
 *
 * invariant(result.type === 'success');
 * invariant(result.value.description === undefined);
 * invariant(result.warnings.length === 1); // there will be a warning
 * ```
 */
function voidable<T>(
  checker: Checker<T>,
  options?: $ReadOnly<{
    // if this is true, the checker will not fail
    // validation if an invalid value is provided, instead
    // returning undefined and including a warning as to the invalid type.
    undefinedWithWarningWhenInvalid?: boolean,
  }>,
): Checker<T | void> {
  const {undefinedWithWarningWhenInvalid = false} = options ?? {};

  return (value, parentPath = new Path()): CheckResult<T | void> => {
    if (value === undefined) {
      return success(undefined, []);
    }

    const result = checker(value, parentPath);
    if (result.type === 'success') {
      return success(result.value, result.warnings);
    }

    // if this is enabled, "succeed" the checker with a warning
    // if the non-void value does not match expectation
    if (undefinedWithWarningWhenInvalid) {
      return success(undefined, [result]);
    }

    const {message, path} = result;
    return failure(message, path);
  };
}

/**
 * a checker that provides a withDefault value if the provided value is nullable.
 *
 * For example:
 * ```jsx
 * const objPropertyWithDefault = object({
 *   foo: withDefault(number(), 123),
 * });
 * ```
 * Both `{}` and `{num: 123}` will refine to `{num: 123}`
 */
function withDefault<T>(checker: Checker<T>, fallback: T): Checker<T> {
  return (value, path = new Path()) => {
    if (value == null) {
      return success(fallback, []);
    }
    const result = checker(value, path);
    return result.type === 'failure' || result.value != null
      ? result
      : success(fallback, []);
  };
}

/**
 * wraps a checker with a logical constraint.
 *
 * Predicate function can return either a boolean result or
 * a tuple with a result and message
 *
 * For example:
 *
 * ```javascript
 * import {number, constraint} from 'refine';
 *
 * const evenNumber = constraint(
 *   number(),
 *   n => n % 2 === 0
 * );
 *
 * const passes = evenNumber(2);
 * // passes.type === 'success';
 *
 * const fails = evenNumber(1);
 * // fails.type === 'failure';
 * ```
 */
function constraint<T>(
  checker: Checker<T>,
  predicate: T => boolean | [boolean, string],
): Checker<T> {
  return compose(checker, ({value, warnings}, path) => {
    const result = predicate(value);

    const [passed, message] =
      typeof result === 'boolean'
        ? [result, 'value failed constraint check']
        : result;

    return passed ? success(value, warnings) : failure(message, path);
  });
}

/**
 * wrapper to allow for passing a lazy checker value. This enables
 * recursive types by allowing for passing in the returned value of
 * another checker. For example:
 *
 * ```javascript
 * const user = object({
 *   id: number(),
 *   name: string(),
 *   friends: array(lazy(() => user))
 * });
 * ```
 *
 * Example of array with arbitrary nesting depth:
 * ```jsx
 * const entry = or(number(), array(lazy(() => entry)));
 * const nestedArray = array(entry);
 * ```
 */
function lazy<T>(getChecker: () => Checker<T>): Checker<T> {
  return (value, path = new Path()) => {
    const checker = getChecker();
    return checker(value, path);
  };
}

/**
 * helper to create a custom checker from a provided function.
 * If the function returns a non-nullable value, the checker succeeds.
 *
 * ```jsx
 * const myClassChecker = custom(x => x instanceof MyClass ? x : null);
 * ```
 *
 * Nullable custom types can be created by composing with `nullable()` or
 * `voidable()` checkers:
 *
 * ```jsx
 * const maybeMyClassChecker =
 *   nullable(custom(x => x instanceof MyClass ? x : null));
 * ```
 */
function custom<T>(
  checkValue: (value: mixed) => ?T,
  failureMessage: string = `failed to return non-null from custom checker.`,
): Checker<T> {
  return (value, path = new Path()) => {
    try {
      const checked = checkValue(value);
      return checked != null
        ? success(checked, [])
        : failure(failureMessage, path);
    } catch (error) {
      return failure(error.message, path);
    }
  };
}

module.exports = {
  or,
  union,
  match,
  nullable,
  voidable,
  withDefault,
  constraint,
  asType,
  lazy,
  custom,
};
