---
title: Refine Primitive Checkers
sidebar_label: Primitive Checkers
---

The starting place for building a [Refine checker](/docs/api-reference/refine/Checkers) is with the primitive combinators.

These are the initial building blocks which can be composed into higher order combinators using collections or other custom combinators.

## `boolean()`

Validates a value as a `boolean`

```javascript
// @flow strict
import {boolean} from 'refine';

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

```javascript
// @flow strict
import {number} from 'refine';

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

```javascript
// @flow strict
import {string} from 'refine';

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

```javascript
// @flow strict
import {string} from 'refine';

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

```javascript
// @flow strict
import {literal} from 'refine';

// define checker
// note: to get flow to use the literal, we must annotate
const check = literal<'add_todo'>('add_todo');

// test a value
const result = check('add_todo');
assert(result.type === 'success');

// result should typecheck
const value: 'add_todo' = result.value;

// test an invalid value
const failedResult = check('remove_todo');
assert(failedResult.type === 'failure');
```

## `date()`

Validates a value as a javascript `Date` object

```javascript
// @flow strict
import {date} from 'refine';

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

## `mixed()`

Placeholder / default checker to allow skipping checking of certain values. Always succeeds.

```javascript
// @flow strict
import {mixed} from 'refine';

// define checker
const check = mixed();

// test a value
assert(check(new Date()).type === 'success');
assert(check(1).type === 'success');
assert(check('test').type === 'success');
```

This may be useful if you want to skip checking some unknown values...

```javascript
// @flow strict
import {object, mixed, string, number} from 'refine';

// if we don't want to check below a certain level of an object...
const Request = object({
  code: number(),
  url: string(),
  params: mixed(), // don't care what this is
});
```

## `nullable()`

creates a nullable version of a given checker

```javascript
// @flow strict
import {nullable, string} from 'refine';

// define checker
const check = nullable(string());

// test a value
assert(check('test').type === 'success');
assert(check(null).type === 'success');
assert(check(1).type === 'failure');
```

By default, a value passed to nullable must match the checker spec exactly when it is not null, or it will fail.

Passing the `nullWithWarningWhenInvalid` option enables gracefully handling invalid values that are less important. If the provided checker would mark a result as invalid, the new checker will return null.

For example:

```javascript
// @flow strict
import {nullable, object, string} from 'refine';

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

```javascript
// @flow strict
import {voidable, string} from 'refine';

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

```javascript
// @flow strict
import {voidable, object, string} from 'refine';

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
