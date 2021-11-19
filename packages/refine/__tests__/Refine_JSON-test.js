/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+monitoring_interfaces
 * @flow strict
 * @format
 */
'use strict';

const {object} = require('../Refine_ContainerCheckers');
const {jsonParser, jsonParserEnforced} = require('../Refine_JSON');
const {boolean, number, string} = require('../Refine_PrimitiveCheckers');
const {nullable} = require('../Refine_UtilityCheckers');
const invariant = require('recoil-shared/util/Recoil_invariant');

describe('json', () => {
  it('should correctly parse valid json', () => {
    const parse = jsonParser(
      object({a: string(), b: nullable(number()), c: boolean()}),
    );

    const result = parse('{"a": "test", "c": true}');
    expect(result).toEqual({a: 'test', b: undefined, c: true});
    invariant(result != null, 'should not be null');
    expect(result.a).toEqual('test');
  });

  it('should error on null_or_invalid if desired', () => {
    const MESSAGE = 'IS_NULL_OR_INVALID';

    const parse = jsonParserEnforced(
      object({a: string(), b: nullable(number()), c: boolean()}),
      MESSAGE,
    );

    expect(parse('{"a": "a", "c": true}')).toEqual({
      a: 'a',
      b: undefined,
      c: true,
    });
    expect(() => parse('{"a": "a", "d": true}')).toThrow(new RegExp(MESSAGE));
    expect(() => parse(null)).toThrow(new RegExp(MESSAGE));
  });
});
