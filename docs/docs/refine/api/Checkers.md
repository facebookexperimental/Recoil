---
title: Refine Checkers
sidebar_label: Checkers
---

The core of [Refine](/docs/refine/api/Refine) is the `Checker<T>` type. Checkers are essentially just functions which take in a `mixed` (for Flow) or `unknown` (for TypeScript) value and return  a `CheckResult<T>`...

```jsx
/**
 * a function which checks if a given mixed value matches a type V,
 * returning the value if it does, otherwise a failure message.
 */
type Checker<+V> = (
  value: mixed,
  // optional path within a parent object tree to the current value
  path?: $ReadOnlyArray<string>,
) => CheckResult<V>;

/**
 * the result of checking whether a type matches an expected value
 */
type CheckResult<+V> = CheckSuccess<V> | CheckFailure;

/**
 * the result of failing to match a value to its expected type
 */
type CheckFailure = $ReadOnly<{
  type: 'failure',
  message: string,
  path: $ReadOnlyArray<string>,
}>;

/**
 * the result of successfully matching a value to its expected type
 */
type CheckSuccess<+V> = $ReadOnly<{
  type: 'success',
  value: V,
  // if using `nullable()` with the `nullWithWarningWhenInvalid` option,
  // failures that would have failed the check are appended as warnings
  // here on the success result.
  warnings: $ReadOnlyArray<CheckFailure>
}>;
```

The built-in checkers, detailed below, allow for easy composition. This enables building more complex checkers from basic primitives:

```jsx
// type PersonType = $ReadOnly<{name: string, friends: ?Array<PersonType>}>
// const Person: Checker<PersonType>
const Person = object({
  name: string(),
  friends: nullable(array(lazy(() => Person)))
});
```

Refine provides a number of built-in checkers, see the individual doc pages for more info:
- [Primitive Checkers](/docs/refine/api/primitive_checkers)
- [Collection Checkers](/docs/refine/api/collection_checkers)
- [Advanced Checkers](/docs/refine/api/advanced_checkers)

Additionally, Refine provides some [utility functions](/docs/guides/refine/utilities) for common usecases like json parsing and assertion functions.
