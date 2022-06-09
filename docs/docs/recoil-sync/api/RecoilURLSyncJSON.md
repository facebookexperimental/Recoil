---
title: <RecoilURLSyncJSON>
sidebar_label: <RecoilURLSyncJSON>
---

A component from the [Recoil Sync library](/docs/recoil-sync/introduction) to sync atoms using the [`syncEffect()`](/docs/recoil-sync/api/syncEffect) or [`urlSyncEffect()`](/docs/recoil-sync/api/urlSyncEffect) atom effects with the browser URL.

This is identical to the [`<RecoilURLSync/>`](/docs/recoil-sync/api/RecoilURLSync) component except that it provides built-in JSON encoding and does not accept `serialize`/`deserialize` options.

---

The [JSON standard](https://en.wikipedia.org/wiki/JSON) encodes JavaScript primitives and objects with the corresponding [Refine](/docs/refine/introduction) checkers:
* **null** - [`literal(null)`](/docs/refine/api/Primitive_Checkers#literal) or [`nullable(...)`](/docs/refine/api/Primitive_Checkers#nullable)
* **boolean** - [`boolean()`](/docs/refine/api/Primitive_Checkers#boolean)
* **number** - [`number()`](/docs/refine/api/Primitive_Checkers#number)
* **string** - [`string()`](/docs/refine/api/Primitive_Checkers#string)
* **Array** - [`array(...)`](/docs/refine/api/Collection_Checkers#array) or [`tuple(...)`](/docs/refine/api/Collection_Checkers#tuple)
* **Object** - [`object(...)`](/docs/refine/api/Collection_Checkers#object) or [`dict(...)`](/docs/refine/api/Collection_Checkers#dict)

This implementation handles `undefined` as an empty query param or a non-existent object property.

The `Date` class is also supported by encoding it as an ISO string.  This can be re-hydrated back to a `Date` object if you use the [`jsonDate()`](/docs/refine/api/Primitive_Checkers#jsondate) checker from [Refine](/docs/refine/introduction).

The `Set` and `Map` JavaScript containers are not supported with JSON.  You can use [Transit encoding](/docs/recoil-sync/api/RecoilURLSyncTransit) to encode those containers and custom user classes.

## Examples

See the [URL Persistence Guide](/docs/recoil-sync/url-persistence) for examples.
