---
title: Recoil Sync 0.2
---

- Export `updateItems()` for the [`listen`](https://recoiljs.org/docs/recoil-sync/api/RecoilSync#listen-interface) prop callback in [`<RecoilSync>`](https://recoiljs.org/docs/recoil-sync/api/RecoilSync) in addition to `updateItem()` and `updateAllKnownItems()`. ([#2017](https://github.com/facebookexperimental/Recoil/pull/2017), [#2035](https://github.com/facebookexperimental/Recoil/pull/2035))
- Removing a parameter from the URL will reset atoms when using location `queryParams` with a `param`.  This is a slight breaking change when an atom might sync with multiple URL params. ([#1900](https://github.com/facebookexperimental/Recoil/pull/1900), [#1976](https://github.com/facebookexperimental/Recoil/pull/1976))
- Add a dev warning if an unstable `handlers` prop is detected for [`<RecoilURLSyncTransit>`](https://recoiljs.org/docs/recoil-sync/api/RecoilURLSyncTransit). ([#2044](https://github.com/facebookexperimental/Recoil/pull/2044))
