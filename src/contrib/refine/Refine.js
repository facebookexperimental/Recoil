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

const ROOT_PATH: Path = {
  parent: null,
  field: '<root>',
};

/**
 * the result of failing to match a value to its expected type
 */
export type CheckFailure = $ReadOnly<{
  type: 'failure',
  message: string,
  path: Path,
}>;

/**
 * the result of successfully matching a value to its expected type
 */
export type CheckSuccess<+V> = $ReadOnly<{
  type: 'success',
  value: V,
  // if using `nullable` with the `nullWithWarningWhenInvalid` option,
  // failures will be appended here
  warnings: $ReadOnlyArray<CheckFailure>,
}>;

/**
 * the result of checking whether a type matches an expected value
 */
export type CheckResult<+V> = CheckSuccess<V> | CheckFailure;

/**
 * a function which checks if a given mixed value matches a type V,
 * returning the value if it does, otherwise a failure message.
 */
export type Checker<+V> = (value: mixed, path?: Path) => CheckResult<V>;

/**
 * function to assert that a given value matches a checker
 */
export type AssertionFunction<V> = (value: mixed) => V;

/**
 * function to coerce a given value to a checker type, returning null if invalid
 */
export type CoercionFunction<V> = (value: mixed) => ?V;

/**
 * function which takes a json string, parses it,
 * and matches it with a checker (returning null if no match)
 */
export type JSONParser<T> = (?string) => T;

/**
 * Object field path during checker traversal
 */
export type Path = $ReadOnly<{
  parent: ?Path,
  field: string,
}>;

/**
 * utility type to extract flowtype matching checker structure
 *
 * ```
 * const check = array(record({a: number()}));
 *
 * // equal to: type MyArray = $ReadOnlyArray<{a: number}>;
 * type MyArray = GetType<typeof check>;
 * ```
 */
export type Get<CheckerFunction> = $Call<
  <T>(checker: Checker<T>) => T,
  CheckerFunction,
>;

/**
 * convert path tree to string
 */
function stringifyPath(path: Path): string {
  const pieces = [];
  let current = path;

  while (current != null) {
    const {field, parent} = current;
    pieces.push(field);
    current = parent;
  }

  return pieces.reverse().join('');
}

// private helper to extend the path by a field
function extendPath(parent: Path, field: string): Path {
  return {parent, field};
}

/**
 * wrap value in an object signifying successful checking
 */
function success<V>(
  value: V,
  warnings: $ReadOnlyArray<CheckFailure>,
): CheckSuccess<V> {
  return {type: 'success', value, warnings};
}

/**
 * indicate typecheck failed
 */
function failure(message: string, path: Path): CheckFailure {
  return {type: 'failure', message, path};
}

/**
 * utility function for composing checkers
 */
function compose<T, V>(
  checker: Checker<T>,
  next: (success: CheckSuccess<T>, path: Path) => CheckResult<V>,
): Checker<V> {
  return (value, path = ROOT_PATH) => {
    const result = checker(value, path);
    if (result.type === 'failure') {
      return failure(result.message, result.path);
    }
    return next(result, path);
  };
}

/**
 * helper for raising an error based on a failure
 */
function raiseError(suffix: string, resultFailure: ?CheckFailure): empty {
  if (resultFailure != null) {
    const path = stringifyPath(resultFailure.path);
    const message = resultFailure.message;

    const error = new Error(
      `[refine.js (path=${path}, message=${message})]: ${suffix}`,
    );
    error.stack; // In V8, Errors retain closure scope until stack is accessed
    throw error;
  }

  const error = new Error(`[refine.js (null result)]: ${suffix}`);
  error.stack; // In V8, Errors retain closure scope until stack is accessed
  throw error;
}

/**
 * create a function to assert a value matches a checker, throwing otherwise
 *
 * For example,
 *
 * ```
 * const assert = assertion(array(number()));
 * const value: Array<number> = assert([1,2]);
 *
 * try {
 *   // should throw with `Refine.js assertion failed: ...`
 *   const invalid = assert('test');
 * } catch {
 * }
 * ```
 */
function assertion<T>(
  checker: Checker<T>,
  errorMessage: string = 'assertion error',
): AssertionFunction<T> {
  return value => {
    const result = checker(value, ROOT_PATH);
    return result.type === 'success'
      ? result.value
      : raiseError(errorMessage, result);
  };
}

/**
 * create a CoercionFunction given a checker.
 *
 * Allows for null-coercing a value to a given type using a checker. Optionally
 * provide a callback which receives the full check
 * result object (e.g. for logging).
 *
 * Example:
 *
 * ```javascript
 * import {coercion, record, string} from 'refine';
 * import MyLogger from './MyLogger';
 *
 * const Person = record({
 *   name: string(),
 *   hobby: string(),
 * });
 *
 * const coerce = coercion(Person, result => MyLogger.log(result));
 *
 * declare value: mixed;
 *
 * // ?Person
 * const person = coerce(value);
 * ```
 */
function coercion<T>(
  checker: Checker<T>,
  onResult?: (CheckResult<T>) => void,
): CoercionFunction<T> {
  return value => {
    const result = checker(value, ROOT_PATH);

    if (onResult != null) {
      onResult(result);
    }

    return result.type === 'success' ? result.value : null;
  };
}

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
 * a mixed (i.e. untyped) value
 */
function mixed(): Checker<mixed> {
  return MIXED_CHECKER;
}
const MIXED_CHECKER: Checker<mixed> = value => success(value, []);

/**
 * boolean value checker
 */
function boolean(): Checker<boolean> {
  return BOOLEAN_CHECKER;
}
const BOOLEAN_CHECKER: Checker<boolean> = (value, path = ROOT_PATH) => {
  return typeof value === 'boolean'
    ? success(value, [])
    : failure('value is not a boolean', path);
};

/**
 * checker to assert if a mixed value matches a literal value
 */
function literal<T: string | boolean | number>(literalValue: T): Checker<T> {
  const str = value => JSON.stringify(value);
  return (value, path = ROOT_PATH) => {
    return value === literalValue
      ? success(literalValue, [])
      : failure(`value is not literal ${str(literalValue) ?? 'void'}`, path);
  };
}

/**
 * checker to assert if a mixed value is a string
 */
function string(): Checker<string> {
  return STRING_CHECKER;
}
const STRING_CHECKER: Checker<string> = (value, path = ROOT_PATH) => {
  return typeof value === 'string'
    ? success(value, [])
    : failure('value is not a string', path);
};

/**
 * checker to assert that a string type matches a template regex.
 * Note: the flow type will still be `string`.
 */
function template(regex: RegExp): Checker<string> {
  return constraint(string(), value =>
    regex.test(value)
      ? true
      : [false, `value does not match regex: ${regex.toString()}`],
  );
}

/**
 * checker to assert if a mixed value matches a union of string literals.
 * Legal values are provided as keys in an object and may be translated by
 * providing values in the object.
 *
 * For example:
 * ```jsx
 * ```
 */
function stringLiterals<T>(enumValues: {+[string]: T}): Checker<T> {
  return (value, path = ROOT_PATH) => {
    if (!(typeof value === 'string')) {
      return failure('value must be a string', path);
    }
    const out = enumValues[value];
    if (out == null) {
      return failure(
        `value is not one of ${Object.values(enumValues).join(', ')}`,
        path,
      );
    }
    return success(out, []);
  };
}

/**
 * checker to assert if a mixed value is a number
 */
function number(): Checker<number> {
  return NUMBER_CHECKER;
}
const NUMBER_CHECKER: Checker<number> = (value, path = ROOT_PATH) => {
  return typeof value === 'number'
    ? success(value, [])
    : failure('value is not a number', path);
};

/**
 * checker to assert if a mixed value is a Date object
 */
function date(): Checker<Date> {
  return DATE_CHECKER;
}
const DATE_CHECKER: Checker<Date> = (value, path = ROOT_PATH) => {
  if (!(value instanceof Date)) {
    return failure('value is not a date', path);
  }
  if (isNaN(value)) {
    return failure('invalid date', path);
  }
  return success(value, []);
};

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
 * const Options = record({
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

  return (value, parentPath = ROOT_PATH): CheckResult<?T> => {
    if (value == null) {
      return success(null, []);
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
 * const Options = record({
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

  return (value, parentPath = ROOT_PATH): CheckResult<T | void> => {
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
 * checker which asserts the value matches
 * at least one of the two provided checkers
 */
function or<A, B>(aChecker: Checker<A>, bChecker: Checker<B>): Checker<A | B> {
  return (value, path = ROOT_PATH) => {
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
  return (value, path = ROOT_PATH) => {
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
 *   asType(record({num: number()}), obj => `${obj.num}`),
 * );
 * ```
 */
function match<T>(...checkers: $ReadOnlyArray<Checker<T>>): Checker<T> {
  return union(...checkers);
}

/**
 * wrapper to allow for passing a lazy checker value. This enables
 * recursive types by allowing for passing in the returned value of
 * another checker. For example:
 *
 * ```javascript
 * const user = record({
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
  return (value, path = ROOT_PATH) => {
    const checker = getChecker();
    return checker(value, path);
  };
}

/**
 * checker to assert if a mixed value is an array of
 * values determined by a provided checker
 */
function array<V>(valueChecker: Checker<V>): Checker<$ReadOnlyArray<V>> {
  return (value, path = ROOT_PATH) => {
    if (!Array.isArray(value)) {
      return failure('value is not an array', path);
    }

    const len = value.length;
    const out = new Array(len);
    const warnings = [];

    for (let i = 0; i < len; i++) {
      const element = value[i];
      const result = valueChecker(element, extendPath(path, `[${i}]`));
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
  return (value, path = ROOT_PATH) => {
    if (!Array.isArray(value)) {
      return failure('value is not an array', path);
    }
    const out = new Array(checkers.length);
    const warnings = [];
    for (const [i, checker] of checkers.entries()) {
      const result = checker(value[i], extendPath(path, `[${i}]`));
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
 * checker to assert if a mixed value is a Set type
 */
function set<T>(checker: Checker<T>): Checker<$ReadOnlySet<T>> {
  return (value, path = ROOT_PATH) => {
    if (!(value instanceof Set)) {
      return failure('value is not a Set', path);
    }

    const out = new Set();
    const warnings = [];
    for (const item of value) {
      const result = checker(item, extendPath(path, '[]'));
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
  return (value, path = ROOT_PATH) => {
    if (!(value instanceof Map)) {
      return failure('value is not a Map', path);
    }

    const out = new Map();
    const warnings = [];
    for (const [k, v] of value.entries()) {
      const keyResult = keyChecker(k, extendPath(path, `[${k}] key`));
      if (keyResult.type === 'failure') {
        return failure(keyResult.message, keyResult.path);
      }
      const valueResult = valueChecker(v, extendPath(path, `[${k}]`));
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
 * checker to assert if a mixed value is a string-keyed dict of
 * values determined by a provided checker
 */
function dict<V>(
  valueChecker: Checker<V>,
): Checker<$ReadOnly<{[key: string]: V}>> {
  return (value, path = ROOT_PATH) => {
    if (typeof value !== 'object' || value === null) {
      return failure('value is not an object', path);
    }

    const out: {[key: string]: V} = {};
    const warnings = [];
    for (const [key, element] of Object.entries(value)) {
      const result = valueChecker(element, extendPath(path, `.${key}`));

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
 * Extra properties are ignored.
 *
 * Example:
 * ```jsx
 * const myRecord = record({
 *   name: string(),
 *   job: record({
 *     years: number(),
 *     title: string(),
 *   }),
 * });
 * ```
 *
 * Properties can be optional using `voidable()` or have default values
 * using `withDefault()`:
 * ```jsx
 * const customer = record({
 *   name: string(),
 *   reference: voidable(string()),
 *   method: withDefault(string(), 'email'),
 * });
 * ```
 */
function record<Checkers: $ReadOnly<{...}>>(
  checkers: Checkers,
): Checker<$ReadOnly<$ObjMap<Checkers, <T>(c: Checker<T>) => T>>> {
  const checkerProperties: $ReadOnlyArray<string> = Object.keys(checkers);

  return (value, path = ROOT_PATH) => {
    if (typeof value !== 'object' || value === null) {
      return failure('value is not an object', path);
    }

    const out: {[string]: mixed} = {};
    const warnings = [];

    for (const key of checkerProperties) {
      const check: Checker<mixed> = checkers[key];
      const element: mixed = value.hasOwnProperty(key) ? value[key] : undefined;
      const result = check(element, extendPath(path, `.${key}`));

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
 * identical to `record()` except the resulting value is a writable flow type.
 */
function writableRecord<Checkers: $ReadOnly<{...}>>(
  checkers: Checkers,
): Checker<$ObjMap<Checkers, <T>(c: Checker<T>) => T>> {
  return compose(record(checkers), ({value, warnings}) =>
    success({...value}, warnings),
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
 * identical to `array()` except the resulting value is a writable flow type.
 */
function writableArray<V>(valueChecker: Checker<V>): Checker<Array<V>> {
  return compose(array(valueChecker), ({value, warnings}) =>
    success([...value], warnings),
  );
}

/**
 * a checker that provides a withDefault value if the provided value is nullable.
 *
 * For example:
 * ```jsx
 * const objPropertyWithDefault = record({
 *   foo: withDefault(number(), 123),
 * });
 * ```
 * Both `{}` and `{num: 123}` will refine to `{num: 123}`
 */
function withDefault<T>(checker: Checker<T>, fallback: T): Checker<T> {
  return (value, path = ROOT_PATH) => {
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
 * helper to create a custom checker from a provided function.
 * If the function returns a non-nullable value, the checker succeeds.
 */
function custom<T>(
  checkValue: (value: mixed) => ?T,
  failureMessage: string = `failed to return non-null from custom checker.`,
): Checker<T> {
  return (value, path = ROOT_PATH) => {
    const checked = checkValue(value);
    return checked != null
      ? success(checked, [])
      : failure(failureMessage, path);
  };
}

module.exports = {
  // API
  assertion,
  coercion,

  // Checkers - Primitives
  mixed,
  literal,
  boolean,
  number,
  string,
  template,
  stringLiterals,
  date,

  // Checkers - Utility
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

  // Checkers - Containers
  array,
  tuple,
  record,
  dict,
  set,
  map,
  writableArray,
  writableDict,
  writableRecord,

  // Helpers
  stringifyPath,
};
