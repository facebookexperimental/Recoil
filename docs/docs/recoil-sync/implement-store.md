---
title: Implementing a Store
sidebar_label: Implementing a Store
---

While the library comes with some built-in stores, you can implement your own using [`useRecoilSync()`](/docs/recoil-sync/api/useRecoilSync) or [`<RecoilSync/>`](/docs/recoil-sync/api/RecoilSync).  The hook and component forms are equivalent, use whichever is more convenient for you.  Specify an optional `storeKey` to identify and match up which atoms should sync with which store.  Then, specify the following optional callbacks to define the behavior for your store:

* [**`read`**](/docs/recoil-sync/api/useRecoilSync#read-interface) - How to read an individual item from the external store, such as when initializing the atom.
* [**`write`**](/docs/recoil-sync/api/useRecoilSync#write-interface) - How to write mutated atom state to the external store.
* [**`listen`**](/docs/recoil-sync/api/useRecoilSync#listen-interface) - How to subscribe to async updates from the store to mutate atom state.

See the [API reference](/docs/recoil-sync/api/useRecoilSync) for the full details on the callbacks.

## Example Syncing with React Props

An example store using [`<RecoilSync>`](/docs/recoil-sync/api/RecoilSync) that will initialize atoms based on React prop values:
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

## Example Syncing with User Database

An example store using [`useRecoilSync()`](/docs/recoil-sync/api/useRecoilSync) that will synchronize with a custom database:
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
