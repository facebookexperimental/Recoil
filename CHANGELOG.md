# Change Log

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
