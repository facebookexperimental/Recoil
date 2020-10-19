---
title: State Persistence
sidebar_label: State Persistence
---

Recoil allows you to persist application state using atoms.

----
## *IMPORTANT NOTE*
***This API is currently under development and will change.  Please stay tuned...***

----

## Saving State

To save state, subscribe to atom changes and record the new state.  You could use React effects to subscribe to individual atoms (*See [Asynchronous State Sync](/docs/guides/asynchronous-state-sync)*).  However, Recoil provides a hook to allow you to subscribe to state changes for all atoms using [**`useRecoilTransactionObserver_UNSTABLE()`**](/docs/api-reference/core/useRecoilTransactionObserver).

The subscription callback provides all of the atom state and tells you which atoms changed.  From this you can save the changes with the storage and serialization of your preference.  Here is an example of a basic implementation using JSON:

```jsx
function PersistenceObserver() {
  useRecoilTransactionObserver_UNSTABLE(({snapshot}) => {
    for (const modifiedAtom of snapshot.getNodes_UNSTABLE({isModified: true})) {
      const atomLoadable = snapshot.getLoadable(modifiedAtom);
      if (atomLoadable.state === 'hasValue') {
        Storage.setItem(
          modifiedAtom.key,
          JSON.stringify({value: atomLoadable.contents}),
        );
      }
    }
  });
}
```

*Storage* could be the browser URL history, [*LocalStorage*](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), *[AsyncStorage](https://github.com/react-native-community/react-native-async-storage)* or whichever storage you like.

You may not wish to persist all atoms, or some atoms may have different persistence behaviors.   *Consider the per-atom state synchronization API coming soon*.

## Restoring State

After you ensure that you're saving your state to your storage, you need to recover it when loading the app.  This can be done using the **`initializeState`** prop on the [**`<RecoilRoot>`**](/docs/api-reference/core/RecoilRoot) component.

`initializeState` is a function that provides a [`MutableSnapshot`](/docs/api-reference/core/Snapshot#transforming-snapshots) with a **`set()`** method to set the initial atom value.  This value will be used for the initial rendering.  If you manually set the atom value in a `useEffect()` hook, there will be an initial render with the default value first which can cause flicker or be invalid.

Here is a basic example:

```jsx
const initializeState = ({set}) => {
  for(const [key, value] of Storage.entries()) {
    set(myLookupOfAtomWithKey(key), JSON.parse(value).value);
  }
}

return (
  <RecoilRoot initializeState={initializeState}>
    <PersistenceObserver />
    <SomeComponent />
  </RecoilRoot>
);
```

***NOTE:*** *`myLookupOfAtomWithKey()` is pseudo-code for a lookup of the registered atom based on the key.  As some atoms may be defined dynamically or via atom families this may not be the best approach.  There is a new API coming soon to define per-atom synchronization effects which should be easier to use.*

## Syncing State

You may also wish for asynchronous updates of the storage, such as the user pressing the browser back button with URL persistence, to sync with the current app state.  You can use a React effect to subscribe to these changes and update the value of any modified atoms directly.

*Example coming soon...*

## Backward-Compatibility and Value Validation

What if your state storage is not reliable?  Or what if you change which atoms or types you are using and need to work with previously persisted state?  More documentation and examples on how to handle this coming soon as the API is finalized...
