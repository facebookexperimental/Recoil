---
title: Refine Utilities
sidebar_label: Utilities
---

In addition to the core [Checker](/docs/refine/api/Checkers) combinators provided by [Refine](/docs/refine/Introduction), the library also exposes some utility functions to help with things like JSON parsing and assertion functions.

## `coercion()`

Easily create a function for null-coercing values (with an optional check result callback)

```jsx
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

## `assertion()`

Easily create an assertion function from your checker function.

```jsx
// mixed => $ReadOnlyArray<number>;
const assertArrayOfNum = assertion(array(number()));

declare value: mixed;

try {
  const myArray: $ReadOnlyArray<number> = assertArrayOfNum(value);
} catch {
  // assertion error if value is invalid
}
```

## `CheckerReturnType<Checker>`

To extract the underlying type from a checker function, you can use `CheckerReturnType<typeof checker>`...

```jsx
const check = array(number());

// $ReadOnlyArray<number>;
type MyArray = CheckerReturnType<typeof check>;
```

## `jsonParser()` / `jsonParserEnforced()`

Easily create a JSON parser from your checker function.

```jsx
// ?string => ?$ReadOnlyArray<number>;
const parse = jsonParser(array(number()));

const result = parse('[1,2,3]']);
```

If you would like to throw on invalid / null JSON, you can use `jsonParserEnforced()`

```jsx
// creates a json parser which will throw on invalid values
const parse = jsonParserEnforced(
  object({a: string(), b: nullable(number()), c: bool()}),

  // message to append to error message
  'Configuration is invalid'
);

const result = parse('...');

// at this point, result must be correct, or `parse()` would throw...
result.a.includes(...);
```
