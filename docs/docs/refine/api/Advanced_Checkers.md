---
title: Advanced Refine Checkers
sidebar_label: Advanced Checkers
---

In addition to [collections](/docs/refine/api/Collection_Checkers) and [primitives](/docs/refine/api/Primitive_Checkers), more complex types can be modeled using the following combinator checkers.

## `or()`

Validates a value as a one of two given checkers.

```jsx
// define checker
const check = or(number(), array(string()));

// result type is correct
const value: number | $ReadOnlyArray<string> = check(1);

// test a value
assert(check(1).type === 'success');
assert(check(['one']).type === 'success');
assert(check(true).type === 'failure');
```

## `union()`

Generalized version of `or()` to multiple values. (Note: there is currently a limitation within flow which requires an explicit type parameter for `union`, thus the motivation for a seperate `or()`).

```jsx
// define checker
const check = union(number(), array(string()), bool());

// test a value
assert(check(1).type === 'success');
assert(check(['one']).type === 'success');
assert(check(true).type === 'success');
assert(check([1]).type === 'failure');
```

## `lazy()`: Recursive Collections

The `lazy()` utility allows for defining recursive checkers.

```jsx
const Person = object({
  name: string(),
  friends: nullable(array(lazy(() => Person))),
});

const result = Person({name: 'alice', friends: [{name: 'bob'}]});
// should succeed to validate
assert(result.type === 'success');
```

WARNING: recursive references in the values will not work, as the checker will stack overflow.

```jsx
const Person = object({
  name: string(),
  friends: nullable(array(lazy(() => Person))),
});

const alice = {name: 'alice', friends: []};

// add self to own friends
alice.friends.push(alice);

// Error: will stack overflow
Person(alice);
```

# Custom Types

## `custom()`

The `custom` utility makes it simple to define a quick custom type, such as a Class.

WARNING: Don't use this with classes requiring type parameters (such as `MyClass<T>`,
as there is no way to validate that the type parameter is correct via instanceof).

```jsx
class MyClass {}

function myClass(): Checker<MyClass> {
  return custom(
    value => value instanceof MyClass ? value : null,
    'value is not a valid instance of MyClass'
  );
}

const check = array(myClass());
assert(check([new MyClass()]).type === 'success');
assert(check([3]).type === 'failure');
```

## `asType()`

`asType()` will convert from one type to another.  Provide a checker for the expected type and a callback function to convert to a different output type.  For example, you could use this to coerce a value to an opaque type.

```jsx
opaque type ID = string;

const IDChecker: Checker<ID> = asType(string(), s => (s: ID));
```

## `match()`

This checker is simply an alias for `union` that restricts all input checkers to produce the same output type.

Using `match()` and [`asType()`](/docs/refine/api/Advanced_Checkers#asType) you can upgrade from previous types to the latest version.

```jsx
const myChecker: Checker<{str: string}> = match(
  object({str: string()}),
  asType(string(), str => ({str: str})),
  asType(number(), num => ({str: String(num)})),
);

const obj1: {str: string} = coercion(myChecker({str: 'hello'}));
const obj2: {str: string} = coercion(myChecker('hello'));
const obj3: {str: string} = coercion(myChecker(123));
```

## `constraint()`

If you would like to require that a value passes a logical predicate, you can use `constraint()`.

```jsx
const evenNumber = constraint(
  number(),
  n => n % 2 === 0
);

const passes = evenNumber(2);
// passes.type === 'success';

const fails = evenNumber(1);
// fails.type === 'failure';
```

## `withDefault()`

A checker that provides a `withDefault()` value if the provided value is nullable.

```jsx
const objPropertyWithDefault = object({
  foo: withDefault(number(), 123),
});

// result will be `{foo: 123}`.
const result = check({});
```
