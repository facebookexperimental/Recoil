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
 * Path during checker traversal
 */
class Path {
  parent: ?Path;
  field: string;

  constructor(parent?: Path | null = null, field?: string = '<root>') {
    this.parent = parent;
    this.field = field;
  }

  // Method to extend path by a field while traversing a container
  extend(field: string): Path {
    return new Path(this, field);
  }

  toString(): string {
    const pieces = [];
    let current = this;

    while (current != null) {
      const {field, parent} = current;
      pieces.push(field);
      current = parent;
    }

    return pieces.reverse().join('');
  }
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
  return (value, path = new Path()) => {
    const result = checker(value, path);
    return result.type === 'failure' ? result : next(result, path);
  };
}

module.exports = {
  Path,
  success,
  failure,
  compose,
};
