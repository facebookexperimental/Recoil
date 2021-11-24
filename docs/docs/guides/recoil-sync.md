---
title: Recoil Sync Library
sidebar_label: Recoil Sync
---

The `recoil-sync` package provides an add-on library to help synchronize Recoil state with external systems.  Simple [asynchronous data queries](/docs/guides/asynchronous-data-queries) can be implemented via selectors and `useEffect()` or [atom effects](/docs/guides/atom-effects) can be used for bi-directional syncing of individual atoms.  The `recoil-sync` add-on package provides the additional functionality:

* **Batching Atomic Transactions** - Updates for multiple atoms can be batched together as a single transaction with the external system.  This can be important if an atomic transaction is required for consistent state of related atoms.
* **Abstract and Flexible** - This API allows users to specify what atoms to sync separately from describing the mechanism of how to sync.  This allows components to use atoms and sync with different systems in different environments without changing their implementation.  For example, a component may use atoms that persist to the URL when used in a stand-alone tool while persisting to a custom user database when embedded in another tool.
* **Validation and Backward Compatibility** - When dealing with state from external sources it is important to validate the input.  When state is persisted beyond the lifetime of an app it can also be important to consider backward compatibility of previous versions of state.  `recoil-sync` helps provide this functionality.
* **Complex Mapping of Atoms to External Storage** - There may not be a one-to-one mapping between atoms and external storage items.  Atoms may migrate to use newer versions of items, may pull props from multiple items, just a piece of some compound state, or other complex mappings.
* **Sync with React Hooks or Props** - This library enables syncing atoms with React hooks or props that are not accessible from atom effects.

The `recoil-sync` library also provides built-in implementations for external stores such as [syncing with the browser URL](/docs/guides/url-persistence).

---

The basic idea is that a [`syncEffect()`](/docs/api-reference/recoil-sync/syncEffect) atom effect is added to each atom that you wish to sync and then a [`useRecoilSync()`](/docs/api-reference/recoil-sync/useRecoilSync) or [`<RecoilSync/>`](/docs/api-reference/recoil-sync/RecoilSync) is added by your `<RecoilRoot>` to specify how to sync those atoms.  You can use built-in stores such as `<RecoilURLSyncJSON>`, make your own, or sync different groups of atoms with different stores.

## Example

Here is a simple example of a specifying that an atom should sync with external state:

```jsx
const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects_UNSTABLE: [
    syncEffect({ refine: number() }),
  ],
});
```

Then, at the root of your application, simply include `<RecoilURLSyncJSON />` to sync all of those tagged atoms with the URL

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncJSON location={{part: 'queryParams'}} />
      ...
    </RecoilRoot>
  )
}
```

That's it!  Now this atom will initialize its state based on the URL during initial load, any state mutations will update the URL, and changes in the URL (such as the back button) will update the atom.  See below for discussion of more advanced scenarios:

---
# Sync Effect

The [`syncEffect()`](/docs/api-reference/recoil-sync/syncEffect) effect is used to tag atoms that should be synchronized and have them initialize their value with the external store.  The only required option is `refine` for input validation.  The `itemKey` option allows you to specify a key for this particular atom with the external store.  If not specified, it defaults to the atom's own key.  A `storeKey` can also be provided to match up which external store to sync with, if you have more than one.  There are additional options, such as `read` and `write` for more advanced cases.

## Input Validation

To validate the input from the external system and refine from `mixed` to a strongly typed Flow or TypeScript input, `recoil-sync` uses the [Refine](TODO) library.  This library uses a set of composable functions to describe the type and perform runtime validation.  The `refine` property of [`syncEffect()`](/docs/api-reference/recoil-sync/syncEffect) takes a Refine `Checker`.  The type of the Refine checker must match the type of the atom.

Example effect for a simple string atom:
```jsx
  syncEffect({ refine: string() }),
```

Example effect for a nullable number:
```jsx
  syncEffect({ refine: nullable(number()) }),
```

Custom user class:
```jsx
  syncEffect({ refine: custom(x => x instanceof MyClass ? x : null) }),
```

More complex example:
```jsx
  syncEffect({ refine: object({
    id: number(),
    friends: array(number()),
    positions: dict(tuple(boolean(), number())),
  })}),
```

See the [Refine documentation](TODO) for details.

## Backward Compatibility

It can be important to support legacy systems or external systems with previous versions of state.  There are several mechanisms available for this

### Upgrade atom type

If an atom was persisted to a store and you have since changed the type of the atom, you can use Refine's `match()` and `asType()` to upgrade the type.  This example reads an ID that is currently a number but was previously stored as a string or an object.  It will upgrade the previous types and the atom will always store the latest type.

```jsx
const myAtom = atom<number>({
  key: 'MyAtom',
  default: 0,
  effects_UNSTABLE: [
    syncEffect({ refine: match(
      number(),
      asType(string(), x => parseInt(x)),
      asType(object({value: number()}), x => x.value)),
    }),
  ],
});
```

### Upgrade atom key

The atom's key may also change over time.  The `read` option allows us to specify how to read the atom from the external store

```jsx
const myAtom = atom<number>({
  key: 'MyAtom',
  default: 0,
  effects_UNSTABLE: [
    syncEffect({
      itemKey: 'new_key',
      read: ({read}) => read('new_key') ?? read('old_key'),
    }),
  ],
});
```

More complex transformations when reading are possible, see below.

### Upgrade atom storage

You can also migrate an atom to sync with a new external store using multiple effects.

```jsx
const myAtom = atom<number>({
  key: 'MyAtom',
  default: 0,
  effects_UNSTABLE: [
    syncEffect({ storeKey: 'old_store', refine: number() }),
    syncEffect({ storeKey: 'new_store', refine: number() }),
  ],
});
```

## Syncing with Multiple Storages

It may be desirable for an atom to always sync with multiple storage systems.  For example, an atom for some UI state may want to persist the current state for a shareable URL while also syncing with a per-user default stored in the cloud.  This can be done simply by composing multiple atom effects (you can mix-and-match using [`syncEffect()`](/docs/api-reference/recoil-sync/syncEffect) or other atom effects).  The effects are executed in order, so the last one gets priority for initializing the atom.

```jsx
const currentTabState = atom<string>({
  key: 'CurrentTab',
  default: 'FirstTab', // Fallback default for first-use
  effects_UNSTABLE: [
    // Initialize default with per-user default from the cloud
    syncEffect({ storeKey: 'user_defaults', refine: string() }),

    // Override with state stored in URL if reloading or sharing
    syncEffect({ storeKey: 'url', refine: string() }),
  ],
});
```

### Abstract Stores
The same atom might also sync with different storages depending on the host environment.  For example:

```jsx
const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects_UNSTABLE: [
    syncEffect({ storeKey: 'ui_state', refine: number() }),
  ],
});
```

A standalone app might sync that atom with the URL:
```jsx
function MyStandaloneApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncTransit storeKey="ui_state" location={{part: 'hash'}} />
        ...
    </RecoilRoot>
  );
}
```

While another app that uses components which use the same atom might want to sync it with local storage:
```jsx
function AnotherApp() {
  return (
    <RecoilRoot>
      <RecoilSyncLocalStorage storeKey="ui_state" />
        ...
    </RecoilRoot>
  )
}
```

## Implementing a Store

While the library comes with some built-in stores, you can implement your own using [`useRecoilSync()`](/docs/api-reference/recoil-sync/useRecoilSync) or [`<RecoilSync/>`](/docs/api-reference/recoil-sync/RecoilSync).  The hook and component forms are equivalent, use whichever is more convenient for you.  Specify an optional `storeKey` to identify and match up which atoms should sync with the store.  Then, specify the following optional callbacks to define the behavior for the store:

* **`read`** - How to read an individual item from the external store, such as when initializing the atom.
* **`write`** - How to write mutated atom state to the external store.
* **`listen`** - How to subscribe to async updates from the store to mutate atom state.

See the [API reference](/docs/api-reference/recoil-sync/useRecoilSync#read-interface) for the full details on the callbacks.

An example store that will initialize atoms based on React prop values:
```jsx
function InitFromProps(props) {
  return (
    <RecoilSync
      storeKey="init-from-props"
      read={itemKey => props[itemKey]}
    />
  );
}
```

An example store that will synchronize with a custom database:
```jsx
function SyncWithDB() {
  const connection = useMyDB();
  useRecoilSync({
    storeKey: 'my-db',
    read: itemKey => connection.get(itemKey),
    write: ({diff}) => {
      for (const [key, value] of diff) {
        connection.set(key, value);
      }
    },
    listen: ({updateItem}) => {
      const subscription = connection.subscribe((key, value) => {
        updateItem(key, value);
      });
      return () => subscription.release();
    },
  });
  return null;
}
```

## Advanced Atom Mappings

Atoms may not map to items in the external store one-to-one.  [This example](/docs/guides/recoil-sync#upgrade-atom-key) describes using `read` to implement a key upgrade.  The `read` and `write` options for [`syncEffect()`](/docs/api-reference/recoil-sync/syncEffect) can be used to implement more complex mappings.

Care must be taken with advanced mappings as there could be ordering issues, atoms may try to overwrite the same items, etc.

### Many-to-one
Example effect for an atom that pulls state from multiple external items:
```jsx
function manyToOneSyncEffect() {
  syncEffect({
    refine: object({ foo: nullable(number()), bar: nullable(number()) }),
    read: ({read}) => ({foo: read('foo'), bar: read('bar')}),
    write: ({write, reset}, newValue) => {
      if (newValue instanceof DefaultValue) {
        reset('foo');
        reset('bar');
      } else {
        write('foo', newValue.foo);
        write('bar', newValue.bar);
      }
    },
  });
}

atom<{foo: number, bar: number}>({
  key: 'MyObject',
  default: {},
  effects_UNSTABLE: [manyToOneSyncEffect()],
});
```

### One-to-many
Example effect that pulls state from a prop in a compound external object:
```jsx
function oneToManySyncEffect(prop: string) {
  const validate = assertion(dict(nullable(number())));
  syncEffect({
    refine: nullable(number()),
    read: ({read}) => validate(read('compound'))[prop],
    write: ({write, read}, newValue) => {
      const compound = {...validate(read('compound'))};
      if (newValue instanceof DefaultValue) {
        delete compound[prop];
        write('compound', compound);
      } else {
        write('compound', {...compound, [prop]: newValue});
      }
    },
  });
}

atom<number>({
  key: 'MyNumber',
  default: 0,
  effects_UNSTABLE: [oneToManySyncEffect('foo')],
});
```
