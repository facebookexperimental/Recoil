---
title: Refine
sidebar_label: Refine
---

**Refine** is a type-refinement / validator combinator library for mixed / unknown values in flow or typescript.

## Getting Started

To get started learning about Refine, check out the documentation on the core concept of [Checkers](/docs/guides/refine/Checkers).

## Why would I want to use refine?
- Refine is useful when your code encounters mixed flow-type (or unknown typescript) values, and you need to assert those values have a specific static type.
- Refine provides an api for building type-refinement helper functions which can validate an unknown value conforms to an expected type.

## Quick Example

```
import {array, object, number, jsonParser} from 'refine';

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

[Recoil Sync](/docs/guides/recoil-sync) leverages refine in within the [RecoilURLSyncJSON](/docs/guides/recoil-sync/RecoilURLSyncJSON) component. See the component documentation for more details.
