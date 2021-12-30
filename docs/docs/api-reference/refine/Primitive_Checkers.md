---
title: Refine Primitive Checkers
sidebar_label: Primitive Checkers
---

The starting place for building a [Refine checker](/docs/api-reference/refine/Checkers) is with the primitive combinators.

These are the initial building blocks which can be composed into higher order combinators using collections or other custom combinators.

## `boolean()`

Validates a value as a `boolean`

```jsx
// define checker
const check = boolean();

// test a value
const result = check(false);
assert(result.type === 'success');

// result should typecheck
const value: boolean = result.value;

// test an invalid value
const failedResult = check(1);
assert(failedResult.type === 'failure');
```

## `number()`

Validates a value as a `number`

```jsx
// define checker
const check = number();

// test a value
const result = check(1);
assert(result.type === 'success');

// result should typecheck
const value: number = result.value;

// test an invalid value
const failedResult = check(false);
assert(failedResult.type === 'failure');
```

## `string()`

Validates a value as a `string`

```jsx
// define checker
const check = string();

// test a value
const result = check('test');
assert(result.type === 'success');

// result should typecheck
const value: string = result.value;

// test an invalid value
const failedResult = check(false);
assert(failedResult.type === 'failure');
```

`string` can also take in a regex argument for validation.

```jsx
// define checker
const check = string(/^users?$/);

// test a value
const result = check('user');
assert(result.type === 'success');

// result should typecheck
const value: string = result.value;

// test an invalid value
const failedResult = check('buser');
assert(failedResult.type === 'failure');
```


## `literal()`

Validates a value as a given literal type

```jsx
// define checker
// note: to get Flow to use the literal, we must annotate
const check = literal<'add_todo'>('add_todo');

// can also use for null/undefined/true/false literals
const checkExactlyNull = literal<null>(null);

// test a value
const result = check('add_todo');
assert(result.type === 'success');

// result should typecheck
const value: 'add_todo' = result.value;

// test an invalid value
const failedResult = check('remove_todo');
assert(failedResult.type === 'failure');
```

## `stringLiterals()`

Checker to assert if a mixed value matches a union of string literals.
Legal values are provided as key/values in an object and may be translated by
providing different values in the object.

```jsx
const suitChecker = stringLiterals({
  heart: 'heart',
  spade: 'spade',
  club: 'club',
  diamond: 'diamond',
});

const suit: 'heart' | 'spade' | 'club' | 'diamond' = assertion(suitChecker())(x);
```

## `date()`

Validates a value as a javascript `Date` object

```jsx
// define checker
const check = date();

// test a value
const result = check(new Date());
assert(result.type === 'success');

// result should typecheck
const value: Date = result.value;

// test an invalid value
const failedResult = check(1);
assert(failedResult.type === 'failure');
```

## `jsonDate()`

Similar to date, though also will implicitly coerce ISO date strings to Date objects.

```jsx
// define checker
const check = jsonDate();

// test a value
const result = check((new Date()).toString());
assert(result.type === 'success');

// result should typecheck
const value: Date = result.value;

// test an invalid value
const failedResult = check(1);
assert(failedResult.type === 'failure');
```

## `mixed()`

Placeholder / default checker to allow skipping checking of certain values. Always succeeds.

```jsx
// define checker
const check = mixed();

// test a value
assert(check(new Date()).type === 'success');
assert(check(1).type === 'success');
assert(check('test').type === 'success');
```

This may be useful if you want to skip checking some unknown values...

```jsx
// if we don't want to check below a certain level of an object...
const Request = object({
  code: number(),
  url: string(),
  params: mixed(), // don't care what this is
});
```

## `nullable()`

creates a nullable version of a given checker

```jsx
// define checker
const check = nullable(string());

// result type of checking a value is a nullable string
const result: ?string = check(null);

// test a value
assert(check('test').type === 'success');
assert(check(null).type === 'success');
assert(check(1).type === 'failure');
```

By default, a value passed to nullable must match the checker spec exactly when it is not null, or it will fail.

Passing the `nullWithWarningWhenInvalid` option enables gracefully handling invalid values that are less important. If the provided checker would mark a result as invalid, the new checker will return null.

For example:

```jsx
const Options = object({
  // this must be a non-null string,
  // or Options is not valid
  filename: string(),
  // if this field is not a string,
  // it will be null and Options will pass the checker
  description: nullable(string(), {
    nullWithWarningWhenInvalid: true,
  })
})

const result = Options({filename: 'test', description: 1});

assert(result.type === 'success');
assert(result.value.description === null);

// there will be a warning
assert(result.warnings.length === 1);
```

## `voidable()`

Similar to `nullable`, creates a version of a given checker which returns `T | void`.

```jsx
// define checker
const check = voidable(string());

// test a value
assert(check('test').type === 'success');
assert(check(null).type === 'failure');
assert(check(undefined).type === 'success');
assert(check(1).type === 'failure');
```

By default, a value passed to nullable must match the checker spec exactly when it is not undefined, or it will fail.

Passing the `undefinedWithWarningWhenInvalid` option enables gracefully handling invalid values that are less important. If the provided checker would mark a result as invalid, the new checker will return undefined.

For example:

```jsx
const Options = object({
  // this must be a non-null string,
  // or Options is not valid
  filename: string(),
  // if this field is not a string,
  // it will be undefined and Options will pass the checker
  description: voidable(string(), {
    undefinedWithWarningWhenInvalid: true,
  })
})

const result = Options({filename: 'test', description: 1});

assert(result.type === 'success');
assert(result.value.description === undefined);

// there will be a warning
assert(result.warnings.length === 1);
```
