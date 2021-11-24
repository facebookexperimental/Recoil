---
title: syncEffect(...)
sidebar_label: syncEffect()
---

A function to get an [atom effect](/docs/guides/atom-effects) for the [`recoil-sync`](/docs/guides/recoil-sync) library to synchronize an atom with external state defined with the [`useRecoilSync()`](/docs/api-reference/recoil-sync/useRecoilSync) hook or [`<RecoilSync/>`](/docs/api-reference/recoil-sync/RecoilSync) component.

---

```jsx
function syncEffect<T>(options: {
  refine: Checker<T>,

  itemKey?: string,
  storeKey?: string,

  syncDefault?: boolean,

  // Optional for advanced mappings
  read?: ReadAtom,
  write?: WriteAtom<T>,
}): AtomEffect<T>
```

  - `refine` - A [Refine](TODO) `Checker<>` function which validates the input

Optional options:
  - `itemKey` - A string key for this particular atom in the external store.  If not provided it defaults to the atom's own key.
  - `storeKey` - A string key to match this effect with a [`useRecoilSync()`](/docs/api-reference/recoil-sync/useRecoilSync) store to sync with.
  - `syncDefault` - If true, the atom will sync the actual default value instead of clearing or resetting the external state.  When set this will also attempt to write the default value when the atom is first read, not just when it is set.
  - `read` - An optional callback describing how to read this atom from the external store.
  - `write` - An optional callback describing how to write this atom to the external store.

---

## Examples

See the [Recoil Sync library guide](/docs/guides/recoil-sync#input-validation) for examples.

## Advanced Mappings

### `read` Interface
```jsx
type ReadItem = ItemKey =>
  | void
  | DefaultValue
  | Promise<DefaultValue | mixed>
  | Loadable<DefaultValue | mixed>
  | mixed;

type ReadAtom = ({read: ReadItem}) =>
  | DefaultValue
  | Promise<DefaultValue | mixed>
  | Loadable<DefaultValue | mixed>
  | mixed;
```

### `write` Interface
```jsx
type WriteItem = <T>(ItemKey, DefaultValue | T) => void;
type ResetItem = ItemKey => void;

type WriteAtomInterface = {
  write: WriteItem,
  reset: ResetItem,
  read: ReadItem,
};
type WriteAtom<T> = (WriteAtomInterface, DefaultValue | T) => void;
```

See the [Recoil Sync library guide](/docs/guides/recoil-sync#advanced-atom-mappings) for examples.
