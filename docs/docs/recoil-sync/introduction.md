---
title: Recoil Sync Library
sidebar_label: Introduction
---

---
> ## ❗️ _Preview Documentation_ ❗️
> ***This is preview documentation for the recoil-sync library before it is released.***<br/>
> ***[Source is available here](https://github.com/facebookexperimental/Recoil/tree/main/packages/recoil-sync).***
>

---

The [`recoil-sync`](https://www.npmjs.com/package/recoil-sync) package provides an add-on library to help synchronize Recoil state with external systems.  Simple [asynchronous data queries](/docs/guides/asynchronous-data-queries) can be implemented via selectors or `useEffect()`, or [atom effects](/docs/guides/atom-effects) can be used for bi-directional syncing of individual atoms.  The `recoil-sync` add-on package provides some additional functionality:

* **Batching Atomic Transactions** - Updates for multiple atoms can be batched together as a single transaction with the external system.  This can be important if an atomic transaction is required for consistent state of related atoms.
* **Abstract and Flexible** - This API allows users to specify what atoms to sync separately from describing the mechanism of how to sync.  This allows components to use atoms and sync with different systems in different environments without changing their implementation.  For example, a component may use atoms that persist to the URL when used in a stand-alone tool while persisting to a custom user database when embedded in another tool.
* **Validation and Backward Compatibility** - When dealing with state from external sources it is important to validate the input.  When state is persisted beyond the lifetime of an app it can also be important to consider backward compatibility of previous versions of state.  `recoil-sync` and [`refine`](/docs/refine/introduction) help provide this functionality.
* **Complex Mapping of Atoms to External Storage** - There may not be a one-to-one mapping between atoms and external storage items.  Atoms may migrate to use newer versions of items, may pull props from multiple items, just a piece of some compound state, or other complex mappings.
* **Sync with React Hooks or Props** - This library enables syncing atoms with React hooks or props that are not accessible from atom effects.

The `recoil-sync` library also provides built-in implementations for external stores, such as [syncing with the browser URL](/docs/recoil-sync/url-persistence).

---

The basic idea is that a [`syncEffect()`](/docs/recoil-sync/sync-effect) can be added to each atom that you wish to sync, and then a [`<RecoilSync>`](/docs/recoil-sync/api/RecoilSync) is added inside your `<RecoilRoot>` to specify how to sync those atoms.  You can use built-in stores such as [`<RecoilURLSyncJSON>`](/docs/recoil-sync/url-persistence), [make your own](/docs/recoil-sync/implement-store), or even sync different groups of atoms with different stores.

## Example

### URL Persistence

Here is a simple example [syncing an atom with the browser URL](/docs/recoil-sync/url-persistence):

```jsx
const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects: [
    syncEffect({ refine: number() }),
  ],
});
```

Then, at the root of your application, simply include [`<RecoilURLSyncJSON>`](/docs/recoil-sync/api/RecoilURLSyncJSON) to sync all of those tagged atoms with the URL

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncJSON location={{part: 'queryParams'}}>
        ...
      </RecoilURLSyncJSON>
    </RecoilRoot>
  )
}
```

That's it!  Now this atom will initialize its state based on the URL during initial load, any state mutations will update the URL, and changes in the URL (such as the back button) will update the atom.  See more examples in the [Sync Effect](/docs/recoil-sync/sync-effect), [Store Implementation](/docs/recoil-sync/implement-store), and [URL Persistence](/docs/recoil-sync/url-persistence) guides.

## Installation

Please see the [Recoil installation guide](/docs/introduction/installation) and add [`recoil-sync`](https://www.npmjs.com/package/recoil-sync) as an additional dependency.

`recoil-sync` also includes the [`refine`](/docs/refine/introduction) library.
