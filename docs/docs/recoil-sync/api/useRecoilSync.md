---
title: useRecoilSync(...)
sidebar_label: useRecoilSync()
---

A hook from the [Recoil Sync library](/docs/recoil-sync/introduction) to define an external store for atoms to sync with using the [`syncEffect()`](/docs/recoil-sync/api/syncEffect) atom effect.

---

```jsx
function useRecoilSync(options: {
  storeKey?: string,

  read?: ReadItem,
  write?: WriteItems,
  listen?: ListenToItems,
}): void

```

The `storeKey` is used to match up which atoms should sync with this external store.

## Read Interface

The `read()` callback defines how to read an item from the external store.  This is used when attempting to initialize the atom value based on the external store.  It may also be called from other complex mappings.

```jsx
type ReadItem = ItemKey =>
  | void
  | DefaultValue
  | Promise<DefaultValue | mixed>
  | Loadable<DefaultValue | mixed>
  | mixed;
```


You may return the actual value of the item in the store.  If the item is not set or available in the store you may return `undefined` or `DefaultValue`.  It is also possible to return an async `Promise` to the value if it requires an async operation to read from the store.  You can also give a [`Loadable`](/docs/api-reference/core/Loadable) representation, which is useful for providing an error state if necessary.

## Write Interface
The `write()` callback is called when atom states are mutated so you can define how to write these changes to the external store.

```jsx
type ItemDiff = Map<ItemKey, DefaultValue | any>;
type ItemSnapshot = Map<ItemKey, DefaultValue | mixed>;

type WriteItems = ({
  diff: ItemDiff,
  allItems: ItemSnapshot,
}) => void;
```

The `write()` callback is provided some named parameters:
- `diff` - A map of item keys and their new values that have changed for this atomic transaction.
- `allItems` - A map of the keys and values for all items that have been used in this store.

The value for an item may be a `DefaultValue` object, which means that the item should be reset or deleted.  If the [`syncEffect()`](/docs/recoil-sync/api/syncEffect) specifies the `syncDefault` option, then the actual default values will be provided instead of the `DefaultValue` placeholder object.

## Listen Interface
The `listen()` callback allows you to subscribe to async updates from the external store and mutate the atom state to keep them in sync.

```jsx
type UpdateItem = <T>(ItemKey, DefaultValue | T) => void;
type UpdateAllKnownItems = ItemSnapshot => void;

type ListenToItems = ({
  updateItem: UpdateItem,
  updateAllKnownItems: UpdateAllKnownItems,
}) => void | (() => void);
```

The `listen()` callback is provided some callbacks in its parameter that allow you to update items to a new value.  Any atoms which have read from those items are "subscribed" and will have their state updated by reading from the updated items.

- `updateItem()` - This will update the value of a single item by providing a key and value.  If the value is `DefaultValue` then it will reset the item to the default.  This only updates a single item, other items will not be affected.
- `updateAllKnownItems()` - This will update multiple items by providing a Map of item keys and values.  Again, if the value of any is `DefaultValue` then it will reset those items.  This function will update *all* of the known items that have been read by atoms syncing with this store.  That means if an item key is not included in the provided Map then that item will be reset to default.

You can return a callback handler function from your `listen()` implementation that will be called when the store effect is cleaned up.  This can be used to cleanup your subscription to the external store.

## Examples

See the ["Implementing a Store"](/docs/recoil-sync/implement-store) guide for examples.
