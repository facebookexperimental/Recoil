/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */
'use strict';

export type {AssertionFunction, CoercionFunction} from './Refine_API';
export type {JSONParser} from './Refine_JSON';
export type {
  Checker,
  CheckFailure,
  CheckResult,
  CheckSuccess,
  Get,
  Path,
} from './Refine_Checkers';
export type {OptionalPropertyChecker} from './Refine_ContainerCheckers';

const {assertion, coercion} = require('./Refine_API');
const {
  array,
  dict,
  map,
  object,
  optional,
  set,
  tuple,
  writableArray,
  writableDict,
  writableObject,
} = require('./Refine_ContainerCheckers');
const {jsonParser, jsonParserEnforced} = require('./Refine_JSON');
const {
  boolean,
  date,
  literal,
  mixed,
  number,
  string,
  stringLiterals,
} = require('./Refine_PrimitiveCheckers');
const {
  asType,
  constraint,
  custom,
  lazy,
  match,
  nullable,
  or,
  union,
  voidable,
  withDefault,
} = require('./Refine_UtilityCheckers');

module.exports = {
  // API
  assertion,
  coercion,
  jsonParser,
  jsonParserEnforced,

  // Checkers - Primitives
  mixed,
  literal,
  boolean,
  number,
  string,
  stringLiterals,
  date,

  // Checkers - Utility
  asType,
  or,
  union,
  match,
  nullable,
  voidable,
  withDefault,
  constraint,
  lazy,
  custom,

  // Checkers - Containers
  array,
  tuple,
  dict,
  object,
  optional,
  set,
  map,
  writableArray,
  writableDict,
  writableObject,
};
