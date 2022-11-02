/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall monitoring_interfaces
 */

'use strict';

import type {CheckerReturnType} from '../Refine_Checkers';
import type {CoercionFunction} from 'Refine_API';
import type {Checker} from 'Refine_Checkers';

const {assertion, coercion} = require('../Refine_API');
const {
  bool,
  date,
  enumObject,
  jsonDate,
  literal,
  number,
  string,
  stringLiterals,
} = require('../Refine_PrimitiveCheckers');
const {asType} = require('../Refine_UtilityCheckers');
const invariant = require('recoil-shared/util/Recoil_invariant');

describe('literal', () => {
  it('should correctly parse exact string', () => {
    const coerce = literal('test');
    const result = coerce('test');
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === 'test', 'should succeed');
  });

  it('should fail parse different string', () => {
    const coerce = literal('test');
    const result = coerce('other');
    invariant(result.type === 'failure', 'should fail');
  });

  it('should correctly parse exact number', () => {
    const coerce = literal(1);
    const result = coerce(1);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === 1, 'should succeed');
  });

  it('should correctly parse exact boolean', () => {
    const coerce = literal(true);
    const result = coerce(true);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === true, 'should succeed');
  });

  it('parse null', () => {
    const coerce = coercion(asType(literal(null), () => true));
    expect(coerce(false)).toEqual(null);
    expect(coerce(null)).toEqual(true);
    expect(coerce(undefined)).toEqual(null);
  });

  it('parse undefined', () => {
    const coerce = coercion(literal(undefined));
    expect(coerce(false)).toEqual(null);
    expect(coerce(null)).toEqual(null);
    expect(coerce(undefined)).toEqual(undefined);
  });
});

describe('bool', () => {
  it('should correctly parse true', () => {
    const coerce = bool();
    const result = coerce(true);
    invariant(result.type === 'success', 'should succeed');

    // test type extraction
    type Result = CheckerReturnType<typeof coerce>;
    const test: Result = true;
    invariant(result.value === test, 'value should be true');
  });

  it('should correctly parse false', () => {
    const coerce = bool();
    const result = coerce(false);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === false, 'value should be false');
  });

  it('should correctly parse invalid', () => {
    const coerce = bool();
    const result = coerce(1);
    invariant(result.type === 'failure', 'should fail');
  });
});

describe('number', () => {
  it('should correctly parse number', () => {
    const coerce = number();
    const result = coerce(1);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === 1, 'value should be true');
  });

  it('should correctly parse invalid', () => {
    const coerce = number();
    const result = coerce(true);
    invariant(result.type === 'failure', 'should fail');
  });
});

describe('string', () => {
  it('should correctly parse number', () => {
    const coerce = string();
    const result = coerce('test');
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === 'test', 'value should be true');
  });

  it('should correctly parse invalid', () => {
    const coerce = string();
    const result = coerce(null);
    invariant(result.type === 'failure', 'should fail');
  });

  it('match regex', () => {
    const coerce = string(/^users?$/);
    expect(coerce('user').type).toBe('success');
    expect(coerce('users').type).toBe('success');
    expect(coerce('busers').type).toBe('failure');
  });
});

describe('stringLiterals', () => {
  it('parse string literals', () => {
    const coerce = coercion(stringLiterals({foo: 'foo', bar: 'bar'}));
    expect(coerce(false)).toEqual(null);
    expect(coerce('fail')).toEqual(null);
    expect(coerce('foo')).toEqual('foo');

    // Confirm it can be typed as a union of string literals
    const _x: null | void | 'foo' | 'bar' = coerce('foo');
  });

  it('parse string literals with transformation', () => {
    const coerce = coercion(stringLiterals({foo: 'eggs', bar: 'spam'}));
    expect(coerce(false)).toEqual(null);
    expect(coerce('fail')).toEqual(null);
    expect(coerce('foo')).toEqual('eggs');

    // Confirm it can be typed as a union of string literals
    const _x: null | void | 'eggs' | 'spam' = coerce('foo');
  });

  it('will cast value into string literal union type', () => {
    const food = Object.freeze({foo: 'eggs', bar: 'spam'});
    const assert = assertion(stringLiterals(food));
    const value = assert('foo');
    // $FlowExpectedError - it is expected to fail
    ('invalid': typeof value);
  });
});

type ExampleEnumType = 'baz' | 'bat';
const ExampleEnum = Object.freeze({foo: 'baz', bar: 'bat'});

describe('enumObject', () => {
  it('parse strings', () => {
    const checker: Checker<ExampleEnumType> = enumObject(ExampleEnum);
    const coerce: CoercionFunction<ExampleEnumType> = coercion(checker);
    expect(coerce(false)).toEqual(null);
    expect(coerce('fail')).toEqual(null);
    expect(coerce('foo')).toEqual(null);
    expect(coerce(1)).toEqual(null);
    expect(coerce('baz')).toEqual('baz');

    // Confirm it can be typed as a union of string literals
    const _x: null | void | 'baz' | 'bat' = coerce('baz');

    type ExampleEnumCheckerReturnType = CheckerReturnType<typeof checker>;

    ('baz': ExampleEnumCheckerReturnType);

    // $FlowExpectedError
    ('bad string': ExampleEnumCheckerReturnType);
  });

  it('parse numbers', () => {
    const coerce = coercion(enumObject({'1': 3, '2': 4}));
    expect(coerce(false)).toEqual(null);
    expect(coerce('fail')).toEqual(null);
    expect(coerce('2')).toEqual(null);
    expect(coerce('3')).toEqual(null);
    expect(coerce(2)).toEqual(null);
    expect(coerce(3)).toEqual(3);

    // Confirm it can be typed as a union of string literals
    const _x: null | void | 3 | 4 = coerce(4);
  });
});

describe('date', () => {
  it('should correctly parse date', () => {
    const coerce = date();
    const d = new Date();
    const result = coerce(d);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === d, 'value should be true');
  });

  it('should correctly parse invalid', () => {
    const coerce = date();
    const result = coerce(true);
    invariant(result.type === 'failure', 'should fail');
  });

  it('should fail an invalid date', () => {
    const coerce = coercion(date());
    const myDate = new Date();
    expect(coerce(myDate)).toEqual(myDate);
    expect(coerce(new Date('invalid'))).toEqual(null);
  });
});

describe('jsonDate', () => {
  it('should parse date strings', () => {
    const coerce = coercion(jsonDate());
    expect(coerce('Oct 26, 1985')).toEqual(new Date('Oct 26, 1985'));
    expect(coerce('1955-11-05T07:00:00.000Z')).toEqual(
      new Date('1955-11-05T07:00:00.000Z'),
    );
  });
});
