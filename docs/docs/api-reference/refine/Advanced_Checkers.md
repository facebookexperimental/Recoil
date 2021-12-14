---
title: Advanced Refine Checkers
sidebar_label: Advanced Checkers
---

In addition to [collections](/docs/api-reference/refine/Collection_Checkers) and [primitives](/docs/api-reference/refine/Primitive_Checkers), more complex types can be modeled using the following combinator checkers.

## `lazy()`: Recursive Collections

The `lazy()` utility allows for defining recursive checkers.

```javascript
// @flow strict
import {object, array, string, lazy, nullable} from 'refine';

const Person = object({
  name: string(),
  friends: nullable(array(lazy(() => Person))),
});

const result = Person({name: 'alice', friends: [{name: 'bob'}]});
// should succeed to validate
assert(result.type === 'success');
```

WARNING: recursive references in the values will not work, as the checker will stack overflow.

```javascript
// @flow strict
import {object, array, string, lazy, nullable} from 'refine';

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

## `or()`

Validates a value as a one of two given checkers.

```javascript
// @flow strict
import {or, number, string, array} from 'refine';

// define checker
const check = or(number(), array(string()));

// test a value
assert(check(1).type === 'success');
assert(check(['one']).type === 'success');
assert(check(true).type === 'failure');
```

## `unioni()`

Generalized version of `or()` to multiple values.

```javascript
// @flow strict
import {union, number, string, array, boolean} from 'refine';

// define checker
const check = union(number(), array(string()), boolean());

// test a value
assert(check(1).type === 'success');
assert(check(['one']).type === 'success');
assert(check(true).type === 'success');
assert(check([1]).type === 'failure');
```

# Custom Types

## `custom()`

The `custom` utility makes it simple to define a quick custom type, such as an enum.

```javascript
// @flow strict
import {custom, array} from 'refine';

enum SourceType {
  A = 1,
  B = 2
}

function myEnum(): Checker<SourceType> {
  return custom(
    value => SourceType.cast(Number(value)),
    'value is not a valid member of SourceType'
  );
}

const check = array(myEnum());
assert(check([SourceType.A]).type === 'success');
assert(check([3]).type === 'failure');
```

## `asType()`

If you want to coerce a value to an opaque type, you can use `asType()`.

```javascript
import {string, asType} from 'refine';

opaque type ID = string;

const IDChecker: Checker<ID> = asType(string(), s => (s: ID));
```

## `constraint()`

If you would like to require that a value passes a logical predicate, you can use `constraint()`.

```javascript
import {number, constraint} from 'refine';

const evenNumber = constraint(
  number(),
  n => n % 2 === 0
);

const passes = evenNumber(2);
// passes.type === 'success';

const fails = evenNumber(1);
// fails.type === 'failure';
```
