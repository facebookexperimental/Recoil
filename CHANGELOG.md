# Change Log

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
