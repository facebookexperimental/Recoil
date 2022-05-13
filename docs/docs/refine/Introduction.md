---
title: Refine
sidebar_label: Refine
---

---
> ## ❗️ _Preview Documentation_ ❗️
> ***This is preview documentation for the Refine library.***<br/>
> ***Refine will initially be bundled as part of the [Recoil Sync](/docs/recoil-sync/introduction) package when released.***
> ***[Source is available here](https://github.com/facebookexperimental/Recoil/tree/main/packages/refine).***
>

---

**Refine** is a type-refinement / validator combinator library for mixed / unknown values in Flow or TypeScript.

## Getting Started

Refine is currently bundled as part of the [Recoil Sync](/docs/recoil-sync/introduction) package.

To get started learning about Refine, check out the documentation on the core concepts of [Utilities](/docs/refine/api/Utilities) and [Checkers](/docs/refine/api/Checkers).

## Why would I want to use Refine?
- Refine is useful when your code encounters `unknown` TypeScript type or `mixed` Flow type values and you need to [assert those values have a specific static type](/docs/refine/Introduction#type-refinement-example).
- Refine provides an API for building type-refinement helper functions which can validate that an unknown value conforms to an expected type.
- Refine can validate input values and [upgrade from previous versions](/docs/refine/Introduction#backward-compatible-example).

## Type Refinement Example

Coerce unknown types to a strongly typed variable.  [`assertion()`](/docs/refine/api/Utilities#assertion) will throw if the input doesn't match the expected type while [`coercion()`](/docs/refine/api/Utilities#coercion) will return `null`.

```jsx
const myObjectChecker = object({
  numberProperty: number(),
  stringProperty: optional(string()),
  arrayProperty: array(number()),
});

const myObjectAssertion = assertion(myObjectChecker);
const myObject: CheckerReturnType<myObjectChecker> = myObjectAssertion({
  numberProperty: 123,
  stringProperty: 'hello',
  arrayProperty: [1, 2, 3],
});
```

## Backward Compatible Example

Using [`match()`](/docs/refine/api/Advanced_Checkers#match) and [`asType()`](/docs/refine/api/Advanced_Checkers#asType) you can upgrade from previous types to the latest version.

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


## JSON Parser Example

Refine wraps `JSON` to provide a built-in strongly typed parser.

```jsx
const myParser = jsonParser(
    array(object({num: number()}))
);

const result = myParser('[{"num": 1}, {"num": 2}]');

if (result != null) {
  // we can now access values in num typesafe way
  assert(result[0].num === 1);
} else {
  // value failed to match parser spec
}
```


## Usage in Recoil Sync

The **Recoil Sync** library leverages **Refine** for type refinement, input validation, and upgrading types for backward compatibility.  See the [`recoil-sync` docs](/docs/recoil-sync/introduction) for more details.
