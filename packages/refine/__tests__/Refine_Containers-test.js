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

const {coercion} = require('../Refine_API');
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
} = require('../Refine_ContainerCheckers');
const {number, string} = require('../Refine_PrimitiveCheckers');
const {lazy, nullable, or, voidable} = require('../Refine_UtilityCheckers');
const invariant = require('recoil-shared/util/Recoil_invariant');

describe('array', () => {
  it('should succeed in coercing correct array', () => {
    const coerce = array(number());
    const result = coerce([1, 2, 3]);
    invariant(result.type === 'success', 'should succeed');
    expect(result.value).toEqual([1, 2, 3]);
  });

  it('should succeed in coercing correct array with null', () => {
    const coerce = array(nullable(number()));
    const result = coerce([1, 2, null]);
    invariant(result.type === 'success', 'should succeed');
    expect(result.value).toEqual([1, 2, null]);
  });

  it('nested array', () => {
    const coerce = coercion(array(array(number())));
    expect(coerce([])).toEqual([]);
    expect(coerce([1, 2])).toEqual(null);
    expect(coerce([[1, 2]])).toEqual([[1, 2]]);
    expect(
      coerce([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(
      coerce([
        [1, 2],
        ['str', 4],
      ]),
    ).toEqual(null);
    expect(coerce([[[3]]])).toEqual(null);
  });

  it('arbitrary depth nested array', () => {
    const check = or(number(), array(lazy(() => check)));
    const coerce = coercion(array(check));
    expect(coerce(0)).toEqual(null);
    expect(coerce([])).toEqual([]);
    expect(coerce([1, 1])).toEqual([1, 1]);
    expect(coerce([1, 'str'])).toEqual(null);
    expect(coerce([1, [2, 2]])).toEqual([1, [2, 2]]);
    expect(coerce([1, [[3], [3, [4]]]])).toEqual([1, [[3], [3, [4]]]]);
  });

  it('should succeed in not coercing correct array with nullable element', () => {
    const coerce = array(number());
    const result = coerce([1, null, 3]);
    invariant(result.type === 'failure', 'should fail');
    expect(result.path.toString()).toEqual('<root>[1]');
  });

  it('should succeed in not coercing correct array with invalid element', () => {
    const coerce = array(number());
    const result = coerce([1, 2, '3']);
    invariant(result.type === 'failure', 'should fail');
    expect(result.path.toString()).toEqual('<root>[2]');
  });

  it('should succeed when using writable version, with correct type', () => {
    const coerce = writableArray(number());
    const result = coerce([1, 2, 3]);
    invariant(result.type === 'success', 'should succeed');
    result.value[0] = 3;
  });
});

describe('tuple', () => {
  it('mixed type tuples', () => {
    const coerce = coercion(tuple(number(), string()));
    expect(coerce(false)).toEqual(null);
    expect(coerce([])).toEqual(null);
    expect(coerce([1])).toEqual(null);
    expect(coerce([1, 'str'])).toEqual([1, 'str']);
  });

  it('nested tuples', () => {
    const coerce = coercion(tuple(number(), tuple(number(), string())));
    expect(coerce([])).toEqual(null);
    expect(coerce([1, 'str'])).toEqual(null);
    expect(coerce([1, [1, 'str']])).toEqual([1, [1, 'str']]);
  });

  it('optional trailing entries', () => {
    const coerce = coercion(tuple(number(), voidable(string())));
    expect(coerce([])).toEqual(null);
    expect(coerce([1])).toEqual([1, undefined]);
    expect(coerce([1, 'str'])).toEqual([1, 'str']);
    expect(coerce([1, 2])).toEqual(null);
    expect(coerce([1, 'str', 3])).toEqual([1, 'str']);
  });
});

describe('dict', () => {
  it('should successfully parse a dictionary', () => {
    const coerce = dict(object({a: number(), b: number()}));
    const result = coerce({test: {a: 1, b: 2}, other: {a: 1, b: 2}});
    invariant(result.type === 'success', 'should succeed');
  });

  it("should fail if the values don't match", () => {
    const coerce = dict(object({a: number(), b: number()}));
    const result = coerce({test: {a: 1, b: 2}, other: {c: 1, d: 2}});
    invariant(result.type === 'failure', 'should fail');
    expect(result.path.toString()).toEqual('<root>.other.a');
  });

  it('should succeed when using writable version, with correct type', () => {
    const coerce = writableDict(number());
    const result = coerce({a: 1, b: 2});
    invariant(result.type === 'success', 'should succeed');
    // should flow check as writable
    result.value.a = 3;
  });

  it('only accept plain objects', () => {
    class MyClass {}
    const coerce = coercion(dict(number()));
    expect(coerce({})).toEqual({});
    expect(coerce(new Date())).toEqual(null);
    expect(coerce(new Map())).toEqual(null);
    expect(coerce(new Set())).toEqual(null);
    expect(coerce(new MyClass())).toEqual(null);
  });
});

describe('object', () => {
  it('should succeed in parsing basic object', () => {
    const coerce = object({
      a: number(),
      b: string(),
    });

    const result = coerce({a: 1, b: 'test'});
    invariant(result.type === 'success', 'should succeed');

    // typecheck assertion
    const a: number = result.value.a;
    const b: string = result.value.b;
    expect(a).toEqual(1);
    expect(b).toEqual('test');
  });

  it('should allow optional props', () => {
    const coerce = object({
      a: number(),
      b: string(),
      c: optional(number()),
    });

    const result = coerce({a: 1, b: 'test'});
    invariant(result.type === 'success', 'should succeed');

    // eslint-disable-next-line no-unused-vars
    const n: ?number = result.value.c;

    // typecheck assertion
    const a: number = result.value.a;
    const b: string = result.value.b;
    expect(a).toEqual(1);
    expect(b).toEqual('test');

    const result2 = coerce({a: 1, b: 'test', c: 2});
    invariant(result2.type === 'success', 'should succeed');

    const result3 = coerce({a: 1, b: 'test', c: undefined});
    invariant(result3.type === 'failure', 'should fail');
  });

  it('should succeed in parsing nested objects', () => {
    const coerce = object({
      name: string(),
      job: object({
        years: number(),
        title: string(),
      }),
    });

    const result = coerce({name: 'Elsa', job: {title: 'Engineer', years: 3}});
    invariant(result.type === 'success', 'should succeed');
    expect(result.value.job.title).toEqual('Engineer');
  });

  it('extra properties are ignored', () => {
    const coerce = coercion(
      object({
        name: string(),
      }),
    );
    expect(coerce({})).toEqual(null);
    expect(coerce({name: 'Elsa'})).toEqual({name: 'Elsa'});
    expect(coerce({name: 'Elsa', sister: 'Anna'})).toEqual({name: 'Elsa'});
  });

  it('optional properties', () => {
    const coerce = coercion(
      object({
        name: string(),
        ref: voidable(string()),
      }),
    );
    expect(coerce({})).toEqual(null);
    expect(coerce({name: 'Elsa'})).toEqual({name: 'Elsa'});
    expect(coerce({name: 'Elsa', ref: 'Anna'})).toEqual({
      name: 'Elsa',
      ref: 'Anna',
    });
    expect(coerce({name: 'Elsa', extra: 'foo'})).toEqual({name: 'Elsa'});
  });

  it('should fail in parsing nested objects with invalid property', () => {
    const coerce = object({
      name: string(),
      job: object({
        years: number(),
        title: string(),
      }),
    });

    const result = coerce({
      name: 'Elsa',
      job: {title: 'Engineer', years: 'woops'},
    });
    invariant(result.type === 'failure', 'should succeed');
    expect(result.path.toString()).toEqual('<root>.job.years');
  });

  it('should succeed when using writable version, with correct type', () => {
    const coerce = writableObject({
      name: string(),
      job: object({
        years: number(),
        title: string(),
      }),
    });

    const result = coerce({name: 'Elsa', job: {title: 'Engineer', years: 3}});
    invariant(result.type === 'success', 'should succeed');

    // should flow check as writable
    result.value.name = 'MechaElsa';
  });

  it('only accept plain objects', () => {
    class MyClass {}
    const coerce = coercion(object({}));
    expect(coerce({})).toEqual({});
    expect(coerce(new Date())).toEqual(null);
    expect(coerce(new Map())).toEqual(null);
    expect(coerce(new Set())).toEqual(null);
    expect(coerce(new MyClass())).toEqual(null);
  });
});

describe('set', () => {
  it('coerce sets', () => {
    const coerce = coercion(set(number()));
    expect(coerce(false)).toEqual(null);
    expect(coerce([1, 2])).toEqual(null);
    expect(coerce(new Set([]))).toEqual(new Set([]));
    expect(coerce(new Set([1, 2]))).toEqual(new Set([1, 2]));
    expect(coerce(new Set([1, 2, 2]))).toEqual(new Set([1, 2]));
    expect(coerce(new Set([1, 2, 'str']))).toEqual(null);
  });

  it('nested sets', () => {
    const coerce = coercion(set(set(number())));
    expect(coerce(null)).toEqual(null);
    expect(coerce(new Set([1]))).toEqual(null);
    expect(coerce(new Set([new Set()]))).toEqual(new Set([new Set()]));
    expect(coerce(new Set([new Set([1])]))).toEqual(new Set([new Set([1])]));
  });
});

describe('map', () => {
  it('coerce maps', () => {
    const coerce = coercion(map(string(), number()));
    expect(coerce(false)).toEqual(null);
    expect(coerce(new Map())).toEqual(new Map());
    expect(coerce(new Map([['foo', 'bar']]))).toEqual(null);
    expect(coerce(new Map([['foo', 123]]))).toEqual(new Map([['foo', 123]]));
    expect(
      coerce(
        new Map([
          ['foo', 123],
          ['bar', 456],
        ]),
      ),
    ).toEqual(
      new Map([
        ['foo', 123],
        ['bar', 456],
      ]),
    );
  });

  it('nested maps', () => {
    const coerce = coercion(map(string(), map(string(), number())));
    expect(coerce(new Map())).toEqual(new Map());
    expect(coerce(new Map([['foo', new Map()]]))).toEqual(
      new Map([['foo', new Map()]]),
    );
    expect(coerce(new Map([['foo', new Map([['bar', 123]])]]))).toEqual(
      new Map([['foo', new Map([['bar', 123]])]]),
    );
  });

  it('map with non-string keys', () => {
    const numberKey = coercion(map(number(), string()));
    expect(numberKey(new Map([['foo', 'bar']]))).toEqual(null);
    expect(numberKey(new Map([[123, 'bar']]))).toEqual(new Map([[123, 'bar']]));

    const objKey = coercion(map(object({str: string()}), number()));
    expect(objKey(new Map([[{str: 'foo'}, 123]]))).toEqual(
      new Map([[{str: 'foo'}, 123]]),
    );
  });
});
