---
title: Refine Collection Checkers
sidebar_label: Collection Checkers
---

Collection [checkers](/docs/refine/api/Checkers) can be combined with [primitive checkers](/docs/refine/api/Primitive_Checkers) to refine more complex values.

## `array()`

Validates a value as a `$ReadOnlyArray<T>`, given a value checker of type `Checker<T>`.

```jsx
// define checker
const check = array(number());

// test a value
const result = check([1,2,3]);
assert(result.type === 'success');

// result should typecheck
const value: $ReadOnlyArray<number> = result.value;

// test an invalid value
assert(check('test').type === 'failure');
assert(check(['test', 'other']).type === 'failure');
```

## `tuple()`

Validates a value as a strictly typed tuple.

```jsx
// define checker
const check = tuple(number(), string(), bool());

// test a value
const result = check([1,'2', false]);
assert(result.type === 'success');

// result should typecheck
const value: $ReadOnly<[number, string, boolean]> = result.value;

// test an invalid value
assert(check('test').type === 'failure');
assert(check(['test', 'other']).type === 'failure');
```

## `dict()`

Validates a value as a `$ReadOnly<{[key: string]: T}>`, given a value checker of type `Checker<T>`.

```jsx
// define checker
const check = dict(number());

// test a value
const result = check({a: 1, b: 2, c: 3});
assert(result.type === 'success');

// result should typecheck
const value: $ReadOnly<{[key: string]: number}> = result.value;

// test an invalid value
assert(check('test').type === 'failure');
assert(check({a: 'test', b: 'other', c: 3}).type === 'failure');
```


## `object()`

Validates a value as a `$ReadOnly<{[key: K]: T}>`, given an object of checkers of type `{[key: K]: Checker<T>}`.

```jsx
// define checker
const check = object({
  a: number(),
  b: string(),
  c: optional(string()) // use `optional` for optional properties
});

// test a value
const result = check({a: 1, b: 'test'});
assert(result.type === 'success');

// result should typecheck
const value: $ReadOnly<{a: number, b: string}> = result.value;

// test an invalid value
assert(check('test').type === 'failure');
assert(check({a: 'test', b: 1}).type === 'failure');
assert(check({a: 1, c: 'test'}).type === 'failure');
```

## `set()`

Checker to assert if a mixed value is a `Set` type with valid values.

```jsx
// define checker
const check = set(number());

// test a value
const result = check(new Set([1, 2]));
assert(result.type === 'success');

// result should typecheck
const value: $ReadOnlySet<number> = result.value;

// test an invalid value
assert(check('test').type === 'failure');
assert(check({a: 'test', b: 'other', c: 3}).type === 'failure');
```

## `map()`

Checker to assert if a mixed value is a `Map` type with valid keys and values.

```jsx
// define checker
const check = map(date(), number());

// test a value
const result = check(new Map([[new Date(), 1], [new Date(2), 2]]));
assert(result.type === 'success');

// result should typecheck
const value: $ReadOnlyMap<Date, number> = result.value;

// test an invalid value
assert(check('test').type === 'failure');
assert(check({a: 'test', b: 'other', c: 3}).type === 'failure');
```

## `writableArray()`

Identical to `array()`, but the returned type is a `Array<>` instead of `$ReadOnlyArray<>`

```jsx
const coerce = writableArray(number());
const result = coerce([1, 2, 3]);

assert(result.type === 'success', 'should succeed');
result.value[0] = 3;
```

## `writableObject()`

Identical to `object`, but the returned type is a writable object instead of `$ReadOnly<>`

```jsx
const coerce = writableObject({
  name: string(),
  job: object({
    years: number(),
    title: string(),
  }),
});

const result = coerce({name: 'Elsa', job: {title: 'Engineer', years: 3}});
assert(result.type === 'success', 'should succeed');

// should Flow check as writable
result.value.name = 'MechaElsa';
```

## `writableDict()`

Identical to `dict()`, but the returned type is a writable object instead of `$ReadOnly<>`

```jsx
const coerce = writableDict(number());
const result = coerce({a: 1, b: 2});
assert(result.type === 'success', 'should succeed');

// should Flow check as writable
result.value.a = 3;
```
