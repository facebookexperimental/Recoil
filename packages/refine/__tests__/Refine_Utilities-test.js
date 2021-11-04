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

import type {Checker} from '../Refine_Checkers';

const invariant = require('../__test_utils__/Refine_invariant');
const {coercion} = require('../Refine_API');
const {array, object} = require('../Refine_ContainerCheckers');
const {boolean, number, string} = require('../Refine_PrimitiveCheckers');
const {
  asType,
  constraint,
  custom,
  lazy,
  match,
  maybe,
  nullable,
  or,
  union,
  voidable,
  withDefault,
} = require('../Refine_UtilityCheckers');

// opaque flow test
opaque type ID = string;
(asType(string(), id => (id: ID)): Checker<ID>);

describe('asType', () => {
  it('upgrade number to string', () => {
    const coerce = coercion(asType(number(), num => `${num}`));
    expect(coerce(false)).toBe(null);
    expect(coerce('str')).toBe(null);
    expect(coerce(123)).toBe('123');
  });
});

describe('or', () => {
  it('should match value when correct', () => {
    const parser = or(string(), number());
    const result = parser('test');
    invariant(result.type === 'success', 'should succeed');
    expect(result.value).toEqual('test');
    const second = parser(1);
    invariant(second.type === 'success', 'should succeed');
    expect(second.value).toEqual(1);
  });

  it('should not match if value is not correct', () => {
    const parser = or(string(), number());
    const result = parser(true);
    invariant(result.type === 'failure', 'should fail');
  });
});

describe('union', () => {
  it('should match value when correct', () => {
    const parser = union(string(), number(), boolean());
    const result = parser('test');
    invariant(result.type === 'success', 'should succeed');
    expect(result.value).toEqual('test');
    const second = parser(1);
    invariant(second.type === 'success', 'should succeed');
    expect(second.value).toEqual(1);
    const third = parser(true);
    invariant(third.type === 'success', 'should succeed');
    expect(third.value).toEqual(true);
  });

  it('should not match if value is not correct', () => {
    const parser = union(string(), number());
    const result = parser(true);
    invariant(result.type === 'failure', 'should fail');
  });
});

describe('match', () => {
  it('upgrade to string from various types', () => {
    const coerce = coercion(
      match(
        string(),
        asType(number(), num => `${num}`),
        asType(object({str: string()}), obj => obj.str),
        asType(object({num: number()}), obj => `${obj.num}`),
      ),
    );
    expect(coerce(false)).toBe(null);
    expect(coerce('str')).toBe('str');
    expect(coerce(123)).toBe('123');
    expect(coerce({num: 123})).toBe('123');
    expect(coerce({str: 'str'})).toBe('str');
    expect(coerce({num: 123, str: 'str'})).toBe('str');
    expect(coerce({foo: 'bar'})).toBe(null);
  });
});

describe('nullable', () => {
  it('should correctly parse nullable value when null', () => {
    const coerce = nullable(string());
    const result = coerce(null);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === null, 'value should be true');
  });

  it('should correctly parse nullable value when not null', () => {
    const coerce = nullable(string());
    const result = coerce('test');
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === 'test', 'value should be true');
  });

  it('should correctly parse invalid', () => {
    const coerce = nullable(string());
    const result = coerce(1);
    invariant(result.type === 'failure', 'should fail');
  });

  it('should validate the value, but return null if invalid', () => {
    const coerce = nullable(string(), {
      nullWithWarningWhenInvalid: true,
    });

    const result = coerce(1);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === null, 'value should be true');
    expect(result.warnings?.length).toBe(1);
  });

  it('should pass along warnings in child result', () => {
    const coerce = object({
      field: nullable(
        object({
          child: nullable(string(), {
            nullWithWarningWhenInvalid: true,
          }),
        }),
      ),
    });

    const result = coerce({field: {child: 1}});
    invariant(result.type === 'success', 'should succeed');
    expect(result.warnings?.length).toBe(1);
    const warning = result.warnings?.[0];
    invariant(warning != null, 'should have warning');
    expect(warning.path.toString()).toEqual('<root>.field.child');
  });

  it('should propogate warnings correctly when using `nullWithWarningWhenInvalid`', () => {
    const nullConfig = {
      nullWithWarningWhenInvalid: true,
    };

    const check = object({
      a: string(),
      b: object({
        c: nullable(number(), nullConfig),
        d: object({
          e: boolean(),
          f: nullable(boolean(), nullConfig),
        }),
      }),
    });

    const result = check({
      a: 'test',
      b: {
        c: 'invalid',
        d: {
          e: true,
          f: 'invalid',
        },
      },
    });

    invariant(result.type === 'success', 'should succeed to validate');
    expect(result.warnings?.[0]?.path.toString()).toEqual('<root>.b.c');
    expect(result.warnings?.[1]?.path.toString()).toEqual('<root>.b.d.f');
  });
});

describe('maybe', () => {
  it('should correctly parse value when undefined is provided', () => {
    const coerce = maybe(string());
    const result = coerce(undefined);

    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === undefined, 'value should be true');
  });

  it('should correctly parse value when null is provided', () => {
    const coerce = maybe(string());
    const result = coerce(null);

    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === null, 'value should be true');
  });

  it('should correctly parse value when non-void value is provided', () => {
    const coerce = maybe(string());
    const result = coerce('test');

    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === 'test', 'value should be true');
  });

  it('should correctly parse invalid', () => {
    const coerce = maybe(string());
    const result = coerce(1);

    invariant(result.type === 'failure', 'should fail');
  });

  it('should validate the value, but return undefined if invalid', () => {
    const coerce = maybe(string(), {
      whenInvalid: 'VOID',
    });

    const result = coerce(1);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === undefined, 'value should be true');
    expect(result.warnings?.length).toBe(1);
  });

  it('should validate the value, but return null if invalid', () => {
    const coerce = maybe(string(), {
      whenInvalid: 'NULL',
    });

    const result = coerce(1);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === null, 'value should be true');
    expect(result.warnings?.length).toBe(1);
  });

  it('should pass along warnings in child result', () => {
    const coerce = object({
      field: maybe(
        object({
          child: maybe(string(), {
            whenInvalid: 'VOID',
          }),
        }),
      ),
    });

    const result = coerce({field: {child: 1}});
    invariant(result.type === 'success', 'should succeed');
    expect(result.warnings?.length).toBe(1);
    const warning = result.warnings?.[0];
    invariant(warning != null, 'should have warning');
    expect(warning.path.toString()).toEqual('<root>.field.child');
  });

  it('should correctly parse omitted voidable keys in record', () => {
    const coerce = object({
      description: maybe(string()),
      title: string(),
    });

    const result = coerce({title: 'test'});
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value.title === 'test', 'value should be true');
    invariant(result.value.description === undefined, 'value should be true');
  });
});

describe('voidable', () => {
  it('should correctly parse value when undefined is provided', () => {
    const coerce = voidable(string());
    const result = coerce(undefined);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === undefined, 'value should be true');
  });

  it('should correctly parse value when non-void value is provided', () => {
    const coerce = voidable(string());
    const result = coerce('test');
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === 'test', 'value should be true');
  });

  it('should correctly parse invalid', () => {
    const coerce = voidable(string());
    const result = coerce(1);
    invariant(result.type === 'failure', 'should fail');
  });

  it('should validate the value, but return undefined if invalid', () => {
    const coerce = voidable(string(), {
      undefinedWithWarningWhenInvalid: true,
    });

    const result = coerce(1);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === undefined, 'value should be true');
    expect(result.warnings?.length).toBe(1);
  });

  it('should pass along warnings in child result', () => {
    const coerce = object({
      field: voidable(
        object({
          child: voidable(string(), {
            undefinedWithWarningWhenInvalid: true,
          }),
        }),
      ),
    });

    const result = coerce({field: {child: 1}});
    invariant(result.type === 'success', 'should succeed');
    expect(result.warnings?.length).toBe(1);
    const warning = result.warnings?.[0];
    invariant(warning != null, 'should have warning');
    expect(warning.path.toString()).toEqual('<root>.field.child');
  });

  it('should correctly parse omitted voidable keys in object', () => {
    const coerce = object({
      description: voidable(string()),
      title: string(),
    });

    const result = coerce({title: 'test'});
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value.title === 'test', 'value should be true');
    invariant(result.value.description === undefined, 'value should be true');
  });
});

describe('withDefault', () => {
  it('provide fallback value', () => {
    const coerce = coercion(withDefault(number(), 456));
    expect(coerce(false)).toEqual(null);
    expect(coerce(123)).toEqual(123);
    expect(coerce('str')).toEqual(null);
    expect(coerce(null)).toEqual(456);
    expect(coerce(undefined)).toEqual(456);
  });

  it('values refined to null also fallback', () => {
    const coerce = coercion(
      withDefault(
        asType(number(), () => null),
        456,
      ),
    );
    expect(coerce(false)).toEqual(null);
    expect(coerce(123)).toEqual(456);
    expect(coerce('str')).toEqual(null);
    expect(coerce(null)).toEqual(456);
    expect(coerce(undefined)).toEqual(456);
  });

  it('object with optional property with default', () => {
    const coerce = coercion(object({num: withDefault(number(), 456)}));
    expect(coerce({num: 123})).toEqual({num: 123});
    expect(coerce({})).toEqual({num: 456});
  });
});

describe('constraint', () => {
  it('should correctly fail values which do not pass predicate', () => {
    const evenNumber = constraint(number(), n => n % 2 === 0);
    expect(evenNumber(2).type).toBe('success');
    expect(evenNumber(1).type).toBe('failure');
  });
  it('should fail if underlying checker fails', () => {
    const evenNumber = constraint(number(), n => n % 2 === 0);
    expect(evenNumber(true).type).toBe('failure');
  });
  it('should correctly provide warning when checker passes but constraint does not', () => {
    const message = 'number is not even';
    const evenNumber = constraint(number(), n => [n % 2 === 0, message]);
    const result = evenNumber(1);
    invariant(result.type === 'failure', 'should fail');
    expect(result.message).toBe(message);
  });
});

describe('lazy', () => {
  it('should successfully parse basic values', () => {
    const coerce: Checker<string> = lazy(() => string());
    const result = coerce('test');
    invariant(result.type === 'success', 'should succeed');
    expect(result.value).toBe('test');
  });

  it('should allow for recursive types', () => {
    const user = object({
      id: number(),
      name: string(),
      friends: nullable(array(lazy(() => user))),
    });

    const result = user({
      id: 1,
      name: 'a',
      friends: [
        {id: 2, name: 'b'},
        {id: 3, name: 'c'},
      ],
    });

    invariant(result.type === 'success', 'should succeed');
    // example for typechecking
    const friendsNames = result.value.friends?.map(f => f.name);
    expect(friendsNames).toEqual(['b', 'c']);
  });
});

describe('custom', () => {
  it('should properly check using a custom function', () => {
    const isOneOrTwo = (v: mixed): ?(1 | 2) => (v === 1 || v === 2 ? v : null);
    const checkOneOrTwo = custom(isOneOrTwo);

    const oneResult = checkOneOrTwo(1);
    invariant(oneResult.type === 'success', 'should succeed');

    const threeResult = checkOneOrTwo(3);
    invariant(threeResult.type === 'failure', 'should fail');
  });

  it('catch errors as failures', () => {
    function userValidator() {
      throw new Error('MY ERROR');
    }
    const result = custom(userValidator)();
    invariant(result.type === 'failure', 'should fail');
    expect(result.message).toEqual('MY ERROR');
  });
});
