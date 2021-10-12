/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+monitoring_interfaces
 * @flow strict
 * @format
 */

'use strict';
import type {Checker, CheckResult, Get} from '../Refine';

const invariant = require('../../../util/Recoil_invariant');
const {
  array,
  assertion,
  asType,
  boolean,
  coercion,
  constraint,
  custom,
  date,
  dict,
  lazy,
  literal,
  map,
  match,
  nullable,
  number,
  or,
  record,
  set,
  string,
  stringifyPath,
  stringLiterals,
  template,
  tuple,
  union,
  voidable,
  withDefault,
  writableArray,
  writableDict,
  writableRecord,
} = require('../Refine');
const {jsonParser, jsonParserEnforced} = require('../Refine_json');

// opaque flow test
opaque type ID = string;
(asType(string(), id => (id: ID)): Checker<ID>);

describe('boolean', () => {
  it('should correctly parse true', () => {
    const coerce = boolean();
    const result = coerce(true);
    invariant(result.type === 'success', 'should succeed');

    // test type extraction
    type Result = Get<typeof coerce>;
    const test: Result = true;
    invariant(result.value === test, 'value should be true');
  });

  it('should correctly parse false', () => {
    const coerce = boolean();
    const result = coerce(false);
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value === false, 'value should be false');
  });

  it('should correctly parse invalid', () => {
    const coerce = boolean();
    const result = coerce(1);
    invariant(result.type === 'failure', 'should fail');
  });
});

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
});

describe('template', () => {
  it('should match correct values', () => {
    const coerce = template(/^users?$/);
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
    const coerce = record({
      field: nullable(
        record({
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
    expect(stringifyPath(warning.path)).toEqual('<root>.field.child');
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
    const coerce = record({
      field: voidable(
        record({
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
    expect(stringifyPath(warning.path)).toEqual('<root>.field.child');
  });

  it('should correctly parse omitted voidable keys in record', () => {
    const coerce = record({
      description: voidable(string()),
      title: string(),
    });

    const result = coerce({title: 'test'});
    invariant(result.type === 'success', 'should succeed');
    invariant(result.value.title === 'test', 'value should be true');
    invariant(result.value.description === undefined, 'value should be true');
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
    expect(stringifyPath(result.path)).toEqual('<root>[1]');
  });

  it('should succeed in not coercing correct array with invalid element', () => {
    const coerce = array(number());
    const result = coerce([1, 2, '3']);
    invariant(result.type === 'failure', 'should fail');
    expect(stringifyPath(result.path)).toEqual('<root>[2]');
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

    const objKey = coercion(map(record({str: string()}), number()));
    expect(objKey(new Map([[{str: 'foo'}, 123]]))).toEqual(
      new Map([[{str: 'foo'}, 123]]),
    );
  });
});

describe('record', () => {
  it('should succeed in parsing basic record', () => {
    const coerce = record({
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

  it('should succeed in parsing nested records', () => {
    const coerce = record({
      name: string(),
      job: record({
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
      record({
        name: string(),
      }),
    );
    expect(coerce({})).toEqual(null);
    expect(coerce({name: 'Elsa'})).toEqual({name: 'Elsa'});
    expect(coerce({name: 'Elsa', sister: 'Anna'})).toEqual({name: 'Elsa'});
  });

  it('optional properties', () => {
    const coerce = coercion(
      record({
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

  it('should fail in parsing nested records with invalid property', () => {
    const coerce = record({
      name: string(),
      job: record({
        years: number(),
        title: string(),
      }),
    });

    const result = coerce({
      name: 'Elsa',
      job: {title: 'Engineer', years: 'woops'},
    });
    invariant(result.type === 'failure', 'should succeed');
    expect(stringifyPath(result.path)).toEqual('<root>.job.years');
  });

  it('should succeed when using writable version, with correct type', () => {
    const coerce = writableRecord({
      name: string(),
      job: record({
        years: number(),
        title: string(),
      }),
    });

    const result = coerce({name: 'Elsa', job: {title: 'Engineer', years: 3}});
    invariant(result.type === 'success', 'should succeed');

    // should flow check as writable
    result.value.name = 'MechaElsa';
  });
});

describe('dict', () => {
  it('should successfully parse a dictionary', () => {
    const coerce = dict(record({a: number(), b: number()}));
    const result = coerce({test: {a: 1, b: 2}, other: {a: 1, b: 2}});
    invariant(result.type === 'success', 'should succeed');
  });

  it("should fail if the values don't match", () => {
    const coerce = dict(record({a: number(), b: number()}));
    const result = coerce({test: {a: 1, b: 2}, other: {c: 1, d: 2}});
    invariant(result.type === 'failure', 'should fail');
    expect(stringifyPath(result.path)).toEqual('<root>.other.a');
  });

  it('should succeed when using writable version, with correct type', () => {
    const coerce = writableDict(number());
    const result = coerce({a: 1, b: 2});
    invariant(result.type === 'success', 'should succeed');
    // should flow check as writable
    result.value.a = 3;
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
    const user = record({
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

describe('json', () => {
  it('should correctly parse valid json', () => {
    const parse = jsonParser(
      record({a: string(), b: nullable(number()), c: boolean()}),
    );

    const result = parse('{"a": "test", "c": true}');
    expect(result).toEqual({a: 'test', b: null, c: true});
    invariant(result != null, 'should not be null');
    expect(result.a).toEqual('test');
  });

  it('should error on null_or_invalid if desired', () => {
    const MESSAGE = 'IS_NULL_OR_INVALID';

    const parse = jsonParserEnforced(
      record({a: string(), b: nullable(number()), c: boolean()}),
      MESSAGE,
    );

    expect(parse('{"a": "a", "c": true}')).toEqual({a: 'a', b: null, c: true});
    expect(() => parse('{"a": "a", "d": true}')).toThrow(new RegExp(MESSAGE));
    expect(() => parse(null)).toThrow(new RegExp(MESSAGE));
  });
});

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

describe('custom', () => {
  it('should properly check using a custom function', () => {
    const isOneOrTwo = (v: mixed): ?(1 | 2) => (v === 1 || v === 2 ? v : null);
    const checkOneOrTwo = custom(isOneOrTwo);

    const oneResult = checkOneOrTwo(1);
    invariant(oneResult.type === 'success', 'should succeed');

    const threeResult = checkOneOrTwo(3);
    invariant(threeResult.type === 'failure', 'should fail');
  });
});

describe('asType', () => {
  it('upgrade number to string', () => {
    const coerce = coercion(asType(number(), num => `${num}`));
    expect(coerce(false)).toBe(null);
    expect(coerce('str')).toBe(null);
    expect(coerce(123)).toBe('123');
  });
});

describe('match', () => {
  it('upgrade to string from various types', () => {
    const coerce = coercion(
      match(
        string(),
        asType(number(), num => `${num}`),
        asType(record({str: string()}), obj => obj.str),
        asType(record({num: number()}), obj => `${obj.num}`),
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

describe('warnings', () => {
  it('should propogate warnings correctly when using `nullWithWarningWhenInvalid`', () => {
    const nullConfig = {
      nullWithWarningWhenInvalid: true,
    };

    const check = record({
      a: string(),
      b: record({
        c: nullable(number(), nullConfig),
        d: record({
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
    expect(stringifyPath(result.warnings?.[0]?.path)).toEqual('<root>.b.c');
    expect(stringifyPath(result.warnings?.[1]?.path)).toEqual('<root>.b.d.f');
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
    const coerce = coercion(record({num: withDefault(number(), 456)}));
    expect(coerce({num: 123})).toEqual({num: 123});
    expect(coerce({})).toEqual({num: 456});
  });
});
