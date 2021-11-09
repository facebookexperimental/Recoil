# Change Log

## UPCOMING
***Add new changes here as they land***

### Pending
- Memory management
- useTransition() compatibility
- Re-renders from Recoil updates now occur 1) earlier, 2) in sync with React updates in the same batch, and 3) before transaction observers instead of after.

## 0.5.2 (2021-11-07)

- Fix TypeScript exports (#1397)

## 0.5.1 (2021-11-05)

- Fix TypeScript exports (#1389)

## 0.5.0 (2021-11-03)

- Added `useRecoilRefresher_UNSTABLE()` hook which forces a selector to re-run it's `get()`, and is a no-op for an atom. (#972, #1294, #1302)
- Atom effect improvements:
  - Add `getLoadable()`, `getPromise()`, and `getInfo_UNSTABLE()` to Atom Effects interface for reading other atoms. (#1205, #1210)
  - Add `isReset` parameter to `onSet()` callback to know if the atom is being reset or not. (#1358, #1345)
- `Loadable` improvements:
  - Publish `RecoilLoadable` interface with factories and type checking for Loadables. (#1263, #1264, #1312)
  - Ability to map Loadables with other Loadables. (#1180)
  - Re-implement Loadable as classes. (#1315)
- Improved dev-mode checks:
  - Atoms freeze default, initialized, and async values.  Selectors should not freeze upstream dependencies. (#1261, #1259)
  - Perform runtime check that required options are provided when creating atoms and selectors. (#1324)
- Allow class instances in family parameters for Flow

## 0.4.1 (2021-08-26)

- Performance optimizations to suppress re-rendering components:
    - When subscribed selectors evaluate to the same value. (#749, #952)
    - On initial render when not using React Concurrent Mode (#820)
    - When selector async deps resolve, but React re-renders before chained promises have executed.
- Fixed #1072 where in some cases selectors with async deps would not update in response to state updates

## 0.4 (2021-07-30)

### New Features
- Selector cache configuration: introduced `cachePolicy_UNSTABLE` option for selectors and selector families. This option allows you to control the behavior of how the selector evicts entries from its internal cache.
- Improved `useRecoilTransaction_UNSTABLE()` hook for transactions with multiple atoms (#1085)

### Fixes and Optimizations

- Fix TypeScript typing for `selectorFamily()`, `getCallback()`, `useGetRecoilValueInfo()`, and `Snapshot#getNodes()` (#1060, #1116, #1123)
- Allow mutable values in selectors to be used with waitFor*() helpers (#1074, #1096)
- Atom Effects fixes:
  - Fix onSet() handler to get the proper new value when an atom is reset or has an async default Promise that resolves (#1059, #1050, #738) (Slightly breaking change)
  - Fix support for multiple Atom effects cleanup handlers (#1125)
  - Fix selector subscriptions when atoms with effects are initialized via a `Snapshot` (#1135, #1107)
- Optimization for async selectors when dependencies resolve to cached values (#1037)
- Remove unnecessary warning message (#1034, #1062)

## 0.3.1 (2021-5-18)

- Fix TypeScript exports

## 0.3.0 (2021-5-14)

For supporting garbage collection in the future there is a slight breaking change that `Snapshot`'s will only be valid for the duration of the callback or render.   A new `retain()` API can be used to persist them longer.  This is not enforced yet, but Recoil will now provide a warning in dev-mode if a `Snapshot` is used past its lifetime. (#1006)

### New Features / Improvements
- Add `override` prop to `<RecoilRoot>` (#973)
- Add `getCallback()` to selector evaluation interface (#989)
- Improved TypeScript and Flow typing for `Loadable`s (#966, #1022)

### Performance Optimizations
- Improve scalability (time and memory) of Atom families by cleaning up a legacy feature.

### Bug Fixes
- Throwing an error in an async selector should be properly caught by `<ErrorBoundary>`'s (#998, #1017)
- Fix for Atom Effects `onSet()` should not be called when triggered from `setSelf()` initializing with a Promise or from the same `onSet()` handler.  (#974, #979, #953, #986)
- Improved support for Safari (#967, #609)
- Objects stored in selectors are properly frozen in dev mode (#911)

## 0.2.0 (2021-3-18)

### Major improvements

- More reliable async selectors
- Improved performance using HAMT data structures (b7d1cfddec66dae).

### Other improvements

- Changed semantics of waitForAny() such that it will always return loadables unless everything is loading. This better aligns behaviour of waitForAny() and waitForNone()
- Added a waitForAllSettled helper analogous to Promise.allSettled. (4c95591)
- Friendly error message for misuse of useRecoilCallback (#870)
- Friendly error message if you try to use an async function as a selector setter, which is not supported. (#777)
- Improved React Native support. (#748, #702)
- Added useGetRecoilValueInfo_UNSTABLE() hook for dev tools. (#713, #714)

### Bug fixes

- Selectors now treat any non-Promise that is thrown as an error, rather than only instances of Error. (f0e66f727)
- A child of RecoilRoot could sometimes have its state updated after being unmounted. (#917)
- The error message for missing RecoilRoot wasn't displayed on React experimental releases. (#712)
- IE 11 compatibility (#894, d27c800d8)
- Errors shouldn't be frozen (#852)
- Atom effects could fail to initialize atoms in certain cases (#775).
- Async selectors would fail with multiple React roots (a618a3).

## 0.1.3 (2021-3-2)

- Fixed peer dependencies

## 0.1.2 (2020-10-30)

- Fix TypeScript exports

## 0.1.1 (2020-10-29)

- Performance Improvements
- Experimental React Native support
- Experimental Atom Effects
- Experimental Snapshot construction

## 0.0.13 (2020-09-16)

- Fix for bug affecting SSR

## 0.0.12 (2020-09-15)

- Fix for bug affecting SSR on development builds

## 0.0.11 (2020-09-15)

- Experimental React Concurrent Mode Support
- Performance
- Flow Types
- ES, CommonJS, and UMD packages
- Synchronization Across React Roots
- Preliminary Developer Tools API
- Test Infrastructure Fixes

## 0.0.10 (2020-06-18)

### Bug Fix

- Fix exports for snapshot hooks

## 0.0.9 (2020-06-17)

### Features

- TypeScript support now rolled into Recoil repository and package.
- Recoil Snapshot API for observing and managing global Recoil state.

### Improvements

- Throw error with meaningful message if user doesn't use an atom or selector with most Recoil hooks (#205) - Thanks @alexandrzavalii
- Improve testing (#321, #318, #294, #262, #295) - Thanks @aaronabramov, @Komalov, @mondaychen, @drarmstr, and @tyler-mitchell
- Improve open-source build (#249, #203, #33) - Thanks to @tony-go, @acutmore, and @jaredpalmer

### Bug Fixes

- Some fixes for Server Side Rendering, though we do not officially support it yet. (#233, #220, #284) - Thanks @fyber-LJX, @Chrischuck, and @aulneau
- Fix selectors recording dependency subscriptions in some cases (#296) - Thanks @drarmstr
- Fix updaters in `useRecoilCallback()` getting current state (#260) - Thanks @drarmstr
- Fix error messages when throwing certain errors in the open-source build. (#199) - Thanks @jonthomp
- Reduce Flow errors for open-source builds (#308) - Thanks @Komalov

## 0.0.8 (2020-05-30)

### Bug Fixes

- Build system and repository syncing fixed.
- Fixed a bug where atoms that stored self-referential structures would cause an infinite loop. (#153)
- Fixed bugs affecting Server-Side Rendering. (#53)

### Features

- TypeScript support is now available via DefinitelyTyped.
- `atomFamily` and `selectorFamily`: these provide a standard way to create atoms and selectors using memoized functions. Compared with doing this yourself, in the future these will help with memory management.
- `noWait`, `waitForNone`, `waitForAny`, `waitForAll`: helpers for concurrency and other advanced logic in async selectors.
- `constSelector` and `errorSelector`: selectors that always evaluate to a constant or always throw an error.
- `readOnlySelector`: wraps a read-write atom or selector in a read-only interface, for when you need type covariance.
