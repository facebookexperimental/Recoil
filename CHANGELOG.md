# Change Log

## UPCOMING
**_Add new changes here as they land_**

## 0.7.4 (2022-06-21)

- Fix missing flow types (#1857)
- Cleanup memory leak when using atoms with selector defaults. (#1821, #1840, #1844)

## 0.7.3 (2022-06-01)

- Atom effects can initialize or set atoms to wrapped values (#1681)
- Add `parentStoreID_UNSTABLE` to atom effects which is the ID of the parent store it cloned from, such as the host `<RecoilRoot>` store for `useRecoilCallback()` snapshots. (#1744)
- Enable atoms and selectors to be used in family parameters (#1740)

## 0.7.2 (2022-04-13)

- Selector cache lookup optimizations (#1720, #1736)
- Allow async selectors to re-evaluate when async dependencies are discovered with stale state (#1736)

## 0.7.1 (2022-04-12)

### Typing
- Add explicit `children` prop to `<RecoilRoot>` and `useRecoilBridgeAcrossReactRoots_UNSTABLE()` for TypeScript for `@types/react` with React 18 (#1718, #1717, #1726, #1731)
- Update typing for family parameters to better support Map, Set, and classes with `toJSON()`. (#1709, #1703)

### Fixes
- Avoid dev-mode console error with React 18 when using shared async selectors across multiple `<RecoilRoot>`'s. (#1712)
- Cleanup potential memory leak when using async selectors (#1714)
- Fix potentially hung async selectors when shared across multiple roots that depend on atoms initialized with promises that don't resolve (#1714)

## 0.7 (2022-03-31)

### New Features
- The `default` value is now optional for `atom()` and `atomFamily()`.  If not provided the atom will initialize to a pending state. (#1639)
- Add `getStoreID()` method to `Snapshot` (#1612)
- Publish `RecoilLoadable.loading()` factory for making an async `Loadable` which never resolves. (#1641)

### Breaking Changes
- Selector's `get()` and Atom's `default` can now accept a `Loadable` to put the node in that state.
  If you wish to store a `Loadable`, `Promise`, or `RecoilValue` directly you can wrap it with `selector.value()` or `atom.value()`. (#1640)
- `useRecoilCallback()` now provides a snapshot for the latest state instead of the latest rendered state, which had bugs (#1610, #1604)

### Improvements / Optimizations
- Automatically retain snapshots for the duration of async callbacks. (#1632)
- Optimization for more selector dependencies.  2x improvement with 100 dependencies, 4x with 1,000, and now able to support 10,000+. (#1651, #1515, #914)
- Better error reporting when selectors provide inconsistent results (#1696)

### Fixes
- Avoid spurious console errors from effects when calling `setSelf()` from `onSet()` handlers. (#1589, #1582)
- Freezing user values in dev mode now works in JS environments without the `Window` interface. (#1571)

## 0.6.1 (2022-01-29)

- Fix postInstall script (#1577)

## 0.6 (2022-01-28)

- React 18
  - Leverage new React 18 APIs for improved safety and optimizations. (#1488)
  - Fixes for `<StrictMode>` (#1473, #1444, #1509).
  - Experimental support for `useTransition()` using hooks with `_TRANSITION_SUPPORT_UNSTABLE` suffix. (#1572, #1560)
- Recoil updates now re-render earlier:
  - Recoil and React state changes from the same batch now stay in sync. (#1076)
  - Renders now occur before transaction observers instead of after.

### New Features
- Add `refresh()` to the `useRecoilCallback()` interface for refreshing selector caches. (#1413)
- Callbacks from selector's `getCallback()` can now mutate, refresh, and transact Recoil state, in addition to reading it, for parity with `useRecoilCallback()`. (#1498)
- Recoil StoreID's for `<RecoilRoot>` and `Snapshot` stores accessible via `useRecoilStoreID()` hook (#1417) or `storeID` parameter for atom effects (#1414).
- `RecoilLoadable.all()` and `RecoilLoadable.of()` now accept either literal values, async Promises, or Loadables. (#1455, #1442)
- Add `.isRetained()` method for Snapshots and check if snapshot is already released when using `.retain()` (#1546)

### Other Fixes and Optimizations

- Reduce overhead of snapshot cloning
  - Only clone the current snapshot for callbacks if the callback actually uses it. (#1501)
  - Cache the cloned snapshots from callbacks unless there was a state change. (#1533)
- Fix transitive selector refresh for some cases (#1409)
- Fix some corner cases with async selectors and multiple stores (#1568)
- Atom Effects
  - Run atom effects when atoms are initialized from a set during a transaction from `useRecoilTransaction_UNSTABLE()` (#1466, #1569)
  - Atom effects are cleaned up when initialized by a Snapshot which is released. (#1511, #1532)
  - Unsubscribe `onSet()` handlers in atom effects when atoms are cleaned up. (#1509)
  - Call `onSet()` when atoms are initialized with `<RecoilRoot initializeState={...} >` (#1519, #1511)
- Avoid extra re-renders in some cases when a component uses a different atom/selector. (#825)
- `<RecoilRoot>` will only call `initializeState()` once during the initial render. (#1372)
- Lazily compute the properties of `useGetRecoilValueInfo_UNSTABLE()` and `Snapshot#getInfo_UNSTABLE()` results (#1549)
- Memoize the results of lazy proxies. (#1548)

### Breaking Changes
- Rename atom effects from `effects_UNSTABLE` to just `effects`, as the interface is mostly stabilizing. (#1520)
- Atom effect initialization takes precedence over initialization with `<RecoilRoot initializeState={...} >`. (#1509)
- `useGetRecoilValueInfo_UNSTABLE()` and `Snapshot#getInfo_UNSTABLE()` always report the node `type`. (#1547)

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
  - Atoms freeze default, initialized, and async values. Selectors should not freeze upstream dependencies. (#1261, #1259)
  - Perform runtime check that required options are provided when creating atoms and selectors. (#1324)
- Fix user-thrown promises in selectors for some cases.
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
- Allow mutable values in selectors to be used with waitFor\*() helpers (#1074, #1096)
- Atom Effects fixes:
  - Fix onSet() handler to get the proper new value when an atom is reset or has an async default Promise that resolves (#1059, #1050, #738) (Slightly breaking change)
  - Fix support for multiple Atom effects cleanup handlers (#1125)
  - Fix selector subscriptions when atoms with effects are initialized via a `Snapshot` (#1135, #1107)
- Optimization for async selectors when dependencies resolve to cached values (#1037)
- Remove unnecessary warning message (#1034, #1062)

## 0.3.1 (2021-5-18)

- Fix TypeScript exports

## 0.3.0 (2021-5-14)

For supporting garbage collection in the future there is a slight breaking change that `Snapshot`'s will only be valid for the duration of the callback or render. A new `retain()` API can be used to persist them longer. This is not enforced yet, but Recoil will now provide a warning in dev-mode if a `Snapshot` is used past its lifetime. (#1006)

### New Features / Improvements

- Add `override` prop to `<RecoilRoot>` (#973)
- Add `getCallback()` to selector evaluation interface (#989)
- Improved TypeScript and Flow typing for `Loadable`s (#966, #1022)

### Performance Optimizations

- Improve scalability (time and memory) of Atom families by cleaning up a legacy feature.

### Bug Fixes

- Throwing an error in an async selector should be properly caught by `<ErrorBoundary>`'s (#998, #1017)
- Fix for Atom Effects `onSet()` should not be called when triggered from `setSelf()` initializing with a Promise or from the same `onSet()` handler. (#974, #979, #953, #986)
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
