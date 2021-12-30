---
title: Refine
sidebar_label: Refine
---

**Refine** is a type-refinement / validator combinator library for mixed / unknown values in Flow or TypeScript.

## Getting Started

To get started learning about Refine, check out the documentation on the core concepts of [Utilities](/docs/api-reference/refine/Utilities) and [Checkers](/docs/api-reference/refine/Checkers).

## Why would I want to use Refine?
- Refine is useful when your code encounters mixed Flow-type (or unknown TypeScript) values, and you need to assert those values have a specific static type.
- Refine provides an api for building type-refinement helper functions which can validate that an unknown value conforms to an expected type.

## Quick Example

```jsx
const myParser = jsonParser(
    array(object({a: number()}))
);

const result = myParser('[{"a": 1}, {"a": 2}]');

if (result != null) {
  // we can now access values in a typesafe way
  assert(result[0].a === 1);
} else {
  // value failed to match parser spec
}
```

## Usage in Recoil Sync

[Recoil Sync](/docs/guides/recoil-sync) leverages Refine for type refinement, input validation, and upgrading types for backward compatibility.  See the library docs for more details.
