---
title: class Snapshot
sidebar_label: Snapshot
---

A `Snapshot` object represents an immutable snapshot of the state of Recoil [atoms](/docs/api-reference/core/atom).  It is intended to standardize the API for observing, inspecting, and managing global Recoil state.  It is mostly useful for dev tools, global state synchronization, history navigation, &c.

```jsx
class Snapshot {
  getLoadable: <T>(RecoilValue<T>) => Loadable<T>;
  getPromise: <T>(RecoilValue<T>) => Promise<T>;

  map: (MutableSnapshot => void) => Snapshot;
  asyncMap: (MutableSnapshot => Promise<void>) => Promise<Snapshot>;
}
```

### Reading Snapshots

Snapshots are read-only with respect to atom state.  They can be used to read atom state and evaluate selectors' derived state.  The `getPromise()` method can be used to wait for the evaluated value of asynchronous selectors, so you can see what the value would be based on the static atom state.

### Transforming Snapshots

There are cases where you may wish to mutate a snapshot.  While snapshots are immutable, they have methods to map themselves with a set of transformations to a new immutable snapshot.  The map methods take a callback that is passed a MutableSnapshot, which is mutated throughout the callback and will ultimately become the new snapshot returned by the mapping operation.

```jsx
class MutableSnapshot {
  set: <T>(RecoilState<T>, T | DefaultValue | (T => T | DefaultValue)) => void;
  reset: <T>(RecoilState<T>) => void;
}
```

Notice that `set()` and `reset()` have the same signatue as callbacks provided to a writeable selector's `set` property, but they only effect the new snapshot, not the current state.

### Hooks

Recoil has the following hooks for working with snapshots:

- [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) - Asynchronous access to snapshot
- [`useRecoilSnapshotAndSubscribe()`](/docs/api-reference/core/useRecoilSnapshotAndSubscribe) - Synchronous access to snapshot
- [`useRecoilTransactionObserver()`](/docs/api-reference/core/useRecoilTransactionObserver) - Subscribe to snapshots for all state changes
- [`useGotoRecoilSnapshot()`](/docs/api-reference/core/useGotoRecoilSnapshot) - Update current state to match snapshot

### State Initialization

The [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) component takes an `initializeState` prop for initializing the global state via a `MutableSnapshot`.  This can be helpful for loading persisted state when you know all atoms in advance and is compatible with server-side rendering where the state should be setup synchronously with the initial render.  For most state initialization and persistence, though, consider Atom Effects.

### Example

```jsx
function MyComponent() {
  const logState = useRecoilCallback(({snapshot}) => () => {
    console.log("State: ", snapshot.getLoadable(myAtom).contents);

    const newSnapshot = snapshot.map(({set}) => set(myAtom, 42));
  });
}
```
