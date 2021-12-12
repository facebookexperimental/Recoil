---
title: Utilities
sidebar_label: Utilities
---

In addition to the core [Checker](/docs/guides/refine/Checkers) combinators provided by refine, the library also exposes some utility functions to help with things like JSON parsing and assertion functions.


## `jsonParser` / `jsonParserEnforced`

Easily create a json parser from your checker function.

```javascript
// @flow strict
import {array, number, jsonParser, jsonParserEnforced} from 'refine';

// ?string => ?$ReadOnlyArray<number>;
const parse = jsonParser(array(number()));

const result = parse('[1,2,3]']);
```

If you would like to throw on invalid / null json, you can use `jsonParserEnforced`

```javascript
// creates a json parser which will throw on invalid values
const parse = jsonParserEnforced(
  object({a: string(), b: nullable(number()), c: boolean()}),

  // message to append to error message
  'Configuration is invalid'
);

const result = parse('...');

// at this point, result must be correct, or `parse()` would throw...
result.a.includes(...);
```

## `coercion`

Easily create a function for null-coercing values (with an optional check result callback)

```javascript
// @flow strict
import type {CheckResult} from 'refine';
import {coercion, date} from 'refine';

let callbackResult: ?CheckResult<Date> = null;

// optional callback
const onResult = (result: CheckResult<Date>) => {
  callbackResult = result;
};

// mixed => ?Date
const coerce = coercion(date(), onResult);

const d = new Date();

assert(coerce(d) === d, 'should resolve to value');
assert(callbackResult != null, 'should be set');
assert(callbackResult.type == 'success', 'should succeed');
```

## `assertion`

Easily create an assertion function from your checker function.

```javascript
// @flow strict
import {array, number, assertion} from 'refine';

// mixed => $ReadOnlyArray<number>;
const assertArrayOfNum = assertion(array(number()));

declare value: mixed;

try {
  const myArray: $ReadOnlyArray<number> = assertArrayOfNum(value);
} catch {
  // assertion error if value is invalid
}
```

## `Get<Checker>`

To extract the underlying type from a checker function, you can use `Get<typeof checker>`...

```javascript
// @flow strict
import type {Get} from 'refine';
import {array, number} from 'refine';

const check = array(number());

// $ReadOnlyArray<number>;
type MyArray = Get<typeof check>;
```
