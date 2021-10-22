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

import type {CheckResult} from '../Refine_Checkers';

const invariant = require('../__test_utils__/Refine_invariant');
const {assertion, coercion} = require('../Refine_API');
const {array} = require('../Refine_ContainerCheckers');
const {date, number, string} = require('../Refine_PrimitiveCheckers');
const {or} = require('../Refine_UtilityCheckers');

describe('assertion', () => {
  it('should not throw if value is valid', () => {
    const assert = assertion(array(or(number(), string())));
    const value = assert([1, '2', 3, 4]);
    expect(value).toEqual([1, '2', 3, 4]);
  });

  it('should throw if value is invalid', () => {
    const assert = assertion(array(or(number(), string())));
    expect(() => assert([1, '2', true, 4])).toThrow();
  });
});

describe('coercion', () => {
  it('should return a value when valid', () => {
    const coerce = coercion(date());
    const d = new Date();
    expect(coerce(d)).toBe(d);
  });

  it('should return null when invalid', () => {
    const coerce = coercion(number());
    const d = new Date();
    expect(coerce(d)).toBe(null);
  });

  it('should correctly call calback with result', () => {
    let callbackResult: ?CheckResult<Date> = null;
    const coerce = coercion(date(), result => {
      callbackResult = result;
    });
    const d = new Date();
    expect(coerce(d)).toBe(d);
    invariant(callbackResult != null, 'should be set');
    invariant(callbackResult.type == 'success', 'should succeed');
  });
});
