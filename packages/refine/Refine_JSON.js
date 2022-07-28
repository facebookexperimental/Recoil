/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Helper module for using refine on JSON objects.
 * see wiki for more info: https://fburl.com/wiki/14q16qqy
 *
 * @flow strict
 * @format
 * @oncall monitoring_interfaces
 */
'use strict';

import type {Checker} from './Refine_Checkers';

const {assertion} = require('./Refine_API');

/**
 * function which takes a json string, parses it,
 * and matches it with a checker (returning null if no match)
 */
export type JSONParser<T> = (?string) => T;

/**
 * @param text A valid JSON string or null.
 * @param reviver A function that transforms the results. This function is called for each member of the object.
 * If a member contains nested objects, the nested objects are transformed before the parent object is.
 */
function tryParseJSONMixed(
  text: ?string,
  reviver?: (key: mixed, value: mixed) => mixed,
): mixed {
  if (text == null) {
    return null;
  }
  try {
    return (JSON.parse(text, reviver): mixed);
  } catch {
    return null;
  }
}

/**
 * creates a JSON parser which will error if the resulting value is invalid
 */
function jsonParserEnforced<T>(
  checker: Checker<T>,
  suffix?: string,
): JSONParser<T> {
  const assertedChecker = assertion(checker, suffix ?? 'value is invalid');
  return (rawJSON: ?string) => {
    return assertedChecker(tryParseJSONMixed(rawJSON ?? ''));
  };
}

/**
 * convienience function to wrap a checker in a function
 * for easy JSON string parsing.
 */
function jsonParser<T>(checker: Checker<T>): JSONParser<?T> {
  return (rawJSON: ?string) => {
    const result = checker(tryParseJSONMixed(rawJSON));
    return result.type === 'success' ? result.value : null;
  };
}

module.exports = {
  jsonParserEnforced,
  jsonParser,
};
