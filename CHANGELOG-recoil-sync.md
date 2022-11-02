# Change Log

## UPCOMING
**_Add new changes here as they land_**

## 0.2.0 (2022-10-06)

- Export `updateItems()` for the `listen` prop callback in `<RecoilSync>` in addition to `updateItem()` and `updateAllKnownItems()`. (#2017, #2035)
- Removing parameter from URL will reset atoms when using location `queryParams` with a `param`.  This is also a slight breaking change when an atom might sync with multiple URL params. (#1900, #1976)
- Add dev warning if unstable `<RecoilURLSyncTransit>` `handlers` prop is detected. (#2044)

## 0.1.1 (2022-08-18)

- Use `@recoiljs/refine` version 0.1.1 with fixes.

## 0.1.0 (2022-06-21)

Initial open source release
