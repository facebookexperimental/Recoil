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

const {Path, failure, success} = require('./Refine_Checkers');

/**
 * a mixed (i.e. untyped) value
 */
function mixed(): Checker<mixed> {
  return MIXED_CHECKER;
}
const MIXED_CHECKER: Checker<mixed> = value => success(value, []);

/**
 * checker to assert if a mixed value matches a literal value
 */
function literal<T: string | boolean | number | null | void>(
  literalValue: T,
): Checker<T> {
  const str = value => JSON.stringify(value);
  return (value, path = new Path()) => {
    return value === literalValue
      ? success(literalValue, [])
      : failure(`value is not literal ${str(literalValue) ?? 'void'}`, path);
  };
}

/**
 * boolean value checker
 */
function boolean(): Checker<boolean> {
  return (value, path = new Path()) =>
    typeof value === 'boolean'
      ? success(value, [])
      : failure('value is not a boolean', path);
}

/**
 * checker to assert if a mixed value is a number
 */
function number(): Checker<number> {
  return (value, path = new Path()) =>
    typeof value === 'number'
      ? success(value, [])
      : failure('value is not a number', path);
}

/**
 * Checker to assert if a mixed value is a string.
 *
 * Provide an optional RegExp template to match string against.
 */
function string(regex?: RegExp): Checker<string> {
  return (value, path = new Path()) => {
    if (typeof value !== 'string') {
      return failure('value is not a string', path);
    }

    if (regex != null && !regex.test(value)) {
      return failure(`value does not match regex: ${regex.toString()}`, path);
    }

    return success(value, []);
  };
}

/**
 * Checker to assert if a mixed value matches a union of string literals.
 * Legal values are provided as key/values in an object and may be translated by
 * providing different values in the object.
 *
 * For example:
 * ```jsx
 * const suitChecker = stringLiterals({
 *   heart: 'heart',
 *   spade: 'spade',
 *   club: 'club',
 *   diamond: 'diamond',
 * });
 *
 * const suit: 'heart' | 'spade' | 'club' | 'diamond' = assertion(suitChecker(x));
 * ```
 *
 * Strings can also be mapped to new values:
 * ```jsx
 * const placeholderChecker = stringLiterals({
 *   foo: 'spam',
 *   bar: 'eggs',
 * });
 * ```
 */
function stringLiterals<T>(enumValues: {+[string]: T}): Checker<T> {
  return (value, path = new Path()) => {
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
 * checker to assert if a mixed value is a Date object
 */
function date(): Checker<Date> {
  return (value, path = new Path()) => {
    if (!(value instanceof Date)) {
      return failure('value is not a date', path);
    }
    if (isNaN(value)) {
      return failure('invalid date', path);
    }
    return success(value, []);
  };
}

module.exports = {
  mixed,
  literal,
  boolean,
  number,
  string,
  stringLiterals,
  date,
};
