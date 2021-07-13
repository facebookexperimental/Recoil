---
title: class Snapshot
sidebar_label: Snapshot
---

A `Snapshot` object represents an immutable snapshot of the state of Recoil [atoms](/docs/api-reference/core/atom).  It is intended to standardize the API for observing, inspecting, and managing global Recoil state.  It is mostly useful for dev tools, global state synchronization, history navigation, etc.

```jsx
class Snapshot {
  // Accessors to inspect snapshot state
  getLoadable: <T>(RecoilValue<T>) => Loadable<T>;
  getPromise: <T>(RecoilValue<T>) => Promise<T>;

  // API to transform snapshots for transactions
  map: (MutableSnapshot => void) => Snapshot;
  asyncMap: (MutableSnapshot => Promise<void>) => Promise<Snapshot>;

  // Developer Tools API
  getID: () => SnapshotID;
  getNodes_UNSTABLE: ({
    isModified?: boolean,
  } | void) => Iterable<RecoilValue<mixed>>;
  getInfo_UNSTABLE: <T>(RecoilValue<T>) => {...};
}
```

## Hooks

Recoil provides the following hooks for working with snapshots:

- [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) - Asynchronous access to a Snapshot
- [`useRecoilSnapshot()`](/docs/api-reference/core/useRecoilSnapshot) - Synchronous access to a Snapshot
- [`useRecoilTransactionObserver()`](/docs/api-reference/core/useRecoilTransactionObserver) - Subscribe to Snapshots for all state changes
- [`useGotoRecoilSnapshot()`](/docs/api-reference/core/useGotoRecoilSnapshot) - Update current state to match a Snapshot

## Reading Snapshots

Snapshots are read-only with respect to atom state.  They can be used to read atom state and evaluate selectors' derived state.  `getLoadable()` provides a [`Loadable`](/docs/api-reference/core/Loadable) with the state of the atom or selector in this Snapshot.  The `getPromise()` method can be used to wait for the evaluated value of asynchronous selectors, so you can see what the value would be based on the static atom state.

### Example

```jsx
function MyComponent() {
  const logState = useRecoilCallback(({snapshot}) => () => {
    console.log("State: ", snapshot.getLoadable(myAtom).contents);

    const newSnapshot = snapshot.map(({set}) => set(myAtom, 42));
  });
}
```

## Transforming Snapshots

There are cases where you may wish to mutate a snapshot.  While snapshots are immutable, they have methods to map themselves with a set of transformations to a new immutable snapshot.  The map methods take a callback that is passed a MutableSnapshot, which is mutated throughout the callback and will ultimately become the new snapshot returned by the mapping operation.

```jsx
class MutableSnapshot {
  set: <T>(RecoilState<T>, T | DefaultValue | (T => T | DefaultValue)) => void;
  reset: <T>(RecoilState<T>) => void;
}
```

Notice that `set()` and `reset()` have the same signature as callbacks provided to a writeable selector's `set` property, but they only effect the new snapshot, not the current state.

## Developer Tools

Snapshots provide some methods useful for building developer tools or debugging capabilities with Recoil.  This API is still evolving, and thus marked as `_UNSTABLE`, as we work on the initial dev tools.

### Snapshot IDs

Each committed state or mutated Snapshot has a unique opaque version ID that can be obtained via `getID()`. This can be used to detect when we have gone back to a previous snapshot via `useGotoRecoilSnapshot()`.

### Enumerate Atoms and Selectors

The `getNodes_UNSTABLE()` method can be used to iterate all atoms and selectors that were in use for this snapshot.  Atoms, selectors, and families may be created at any time.  However, they will only show up in the snapshot if they are actually used.  Atoms and selectors may be removed from subsequent state snapshots if they are no longer being used.

An optional `isModified` flag may be specified to only return atoms which have been modified since the last transaction.

### Debug information

The `getInfo_UNSTABLE()` method provides additional debug information for atoms and selectors.  The debug information provided is evolving, but may include:

* `loadable` - A Loadable with the current state.  Unlike methods like `getLoadable()`, this method will not mutate the snapshot at all.  It provides the current state and will not initialize new atoms/selectors, perform any new selector evaluations, or update any dependencies or subscriptions.
* `isSet` - True if this is an atom with an explicit value stored in the snapshot state.  False if this is a selector or using the default atom state.
* `isModified` - True if this is an atom which was modified since the last transaction.
* `type` - Either an `atom` or `selector`
* `deps` - An iterator over the atoms or selectors this node depends on.
* `subscribers` - Information about what is subscribing to this node for this snapshot.  Details under development.

## State Initialization

The [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) component takes an `initializeState` prop for initializing the global state via a `MutableSnapshot`.  This can be helpful for loading persisted state when you know all atoms in advance and is compatible with server-side rendering where the state should be setup synchronously with the initial render.  For most state initialization and persistence, though, consider Atom Effects.
