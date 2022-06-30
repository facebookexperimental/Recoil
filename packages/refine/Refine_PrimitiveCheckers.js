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
 * @oncall monitoring_interfaces
 */
'use strict';

import type {Checker} from './Refine_Checkers';

const {Path, compose, failure, success} = require('./Refine_Checkers');

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
  const str = (value: T) => JSON.stringify(value);
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
 * const suit: 'heart' | 'spade' | 'club' | 'diamond' = assertion(suitChecker())(x);
 * ```
 *
 * Strings can also be mapped to new values:
 * ```jsx
 * const placeholderChecker = stringLiterals({
 *   foo: 'spam',
 *   bar: 'eggs',
 * });
 * ```
 *
 * It can be useful to have a single source of truth for your literals.  To
 * only specify them once and use it for both the Flow union type and the
 * runtime checker you can use the following pattern:
 * ```jsx
 * const suits = {
 *   heart: 'heart',
 *   spade: 'spade',
 *   club: 'club',
 *   diamond: 'diamond',
 * };
 * type Suit = $Values<typeof suits>;
 * const suitChecker = stringLiterls(suits);
 * ```
 */
function stringLiterals<T: {+[string]: string}>(
  enumValues: T,
): Checker<$Values<T>> {
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
 *
 * For example:
 * ```jsx
 * const dateChecker = date();
 *
 * assertion(dateChecker())(new Date());
 * ```
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

/**
 * checker to coerce a date string to a Date object.  This is useful for input
 * that was from a JSON encoded `Date` object.
 *
 * For example:
 * ```jsx
 * const jsonDateChecker = coerce(jsonDate({encoding: 'string'}));
 *
 * jsonDateChecker('October 26, 1985');
 * jsonDateChecker('1955-11-05T07:00:00.000Z');
 * jsonDateChecker(JSON.stringify(new Date()));
 * ```
 */
function jsonDate(): Checker<Date> {
  return compose(string(), ({value, warnings}, path) => {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate)
      ? failure('value is not valid date string', path)
      : success(parsedDate, warnings);
  });
}

module.exports = {
  mixed,
  literal,
  boolean,
  number,
  string,
  stringLiterals,
  date,
  jsonDate,
};
