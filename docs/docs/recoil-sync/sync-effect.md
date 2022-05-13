---
title: Sync Atom Effect - syncEffect()
sidebar_label: Syncing Atoms
---

[`syncEffect()`](/docs/recoil-sync/api/syncEffect) is an [atom effect](/docs/guides/atom-effects) is used to tag atoms that should be synchronized and have them initialize their value with the external store.  The only required option is `refine` for input validation.  The `itemKey` option allows you to specify a key for this particular atom with the external store.  If not specified, it defaults to the atom's own key.  A `storeKey` can also be provided to match up which external store to sync with, if you have more than one.  There are additional options, such as `read` and `write` for more advanced cases.

## Input Validation

To validate the input from the external system and refine from `mixed` to a strongly typed Flow or TypeScript input, `recoil-sync` uses the [Refine](/docs/refine/introduction) library.  This library uses a set of composable functions to describe the type and perform runtime validation.  The `refine` property of [`syncEffect()`](/docs/recoil-sync/api/syncEffect) takes a [Refine `Checker`](/docs/refine/api/Checkers).  The type of the Refine checker must match the type of the atom.

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

See the [Refine documentation](/docs/refine/introduction) for details.

## Backward Compatibility

It can be important to support legacy systems or external systems with previous versions of state.  There are several mechanisms available for this

### Upgrade atom type

If an atom was persisted to a store and you have since changed the type of the atom, you can use Refine's [`match()`](/docs/refine/api/Advanced_Checkers#match) and [`asType()`](/docs/refine/api/Advanced_Checkers#asType) to upgrade the type.  This example reads an ID that is currently a number but was previously stored as a string or an object.  It will upgrade the previous types and the atom will always store the latest type.

```jsx
const myAtom = atom<number>({
  key: 'MyAtom',
  default: 0,
  effects: [
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
  effects: [
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
  effects: [
    syncEffect({ storeKey: 'old_store', refine: number() }),
    syncEffect({ storeKey: 'new_store', refine: number() }),
  ],
});
```

## Syncing with Multiple Storages

It may be desirable for an atom to always sync with multiple storage systems.  For example, an atom for some UI state may want to persist the current state for a shareable URL while also syncing with a per-user default stored in the cloud.  This can be done simply by composing multiple atom effects (you can mix-and-match using [`syncEffect()`](/docs/recoil-sync/api/syncEffect) or other atom effects).  The effects are executed in order, so the last one gets priority for initializing the atom.

```jsx
const currentTabState = atom<string>({
  key: 'CurrentTab',
  default: 'FirstTab', // Fallback default for first-use
  effects: [
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
  effects: [
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

## Advanced Atom Mappings

Atoms may not map to items in the external store one-to-one.  [This example](/docs/recoil-sync/sync-effect#upgrade-atom-key) describes using `read` to implement a key upgrade.  The `read` and `write` options for [`syncEffect()`](/docs/recoil-sync/api/syncEffect) can be used to implement more complex mappings.

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
  effects: [manyToOneSyncEffect()],
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
  effects: [oneToManySyncEffect('foo')],
});
```
