---
title: <RecoilURLSyncJSON ...props />
sidebar_label: <RecoilURLSyncJSON/>
---

A component from the [Recoil Sync library](/docs/guides/recoil-sync) to sync atoms using the [`syncEffect()`](/docs/api-reference/recoil-sync/syncEffect) or [`urlSyncEffect()`](/docs/api-reference/recoil-sync/urlSyncEffect) atom effects with the browser URL.

This is identical to the [`<RecoilURLSync/>`](/docs/api-reference/recoil-sync/RecoilURLSync) component except that it provides built-in JSON encoding and does not accept `serialize`/`deserialize` options.

---

The [JSON standard](https://en.wikipedia.org/wiki/JSON) encodes JavaScript primitives and objects with the corresponding [Refine](TODO) checkers:
* **null** - `literal(null)` or `nullable(...)`
* **boolean** - `boolean()`
* **number** - `number()`
* **string** - `string()`
* **Array** - `array(...)` or `tuple(...)`
* **Object** - `object(...)` or `dict(...)`

This implementation handles `undefined` as an empty query param or a non-existent object property.

The `Date` class is also supported by encoding it as an ISO string.  This can be re-hydrated back to a `Date` object if you use the `jsonDate()` checker from [Refine](TODO).

The `Set` and `Map` JavaScript containers are not supported with JSON.  You can use [Transit encoding](/docs/api-reference/recoil-sync/RecoilURLSyncTransit) to encode those containers and custom user classes.

## Examples

See the [URL Persistence Guide](/docs/guides/url-persistence) for examples.
