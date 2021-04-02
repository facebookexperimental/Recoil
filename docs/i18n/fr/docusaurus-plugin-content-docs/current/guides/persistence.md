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

To save state, subscribe to atom changes and record the new state.  You could use React effects to subscribe to individual atoms (*See [Asynchronous State Sync](asynchronous-state-sync)*).  However, Recoil provides a hook to allow you to subscribe to state changes for all atoms using **`useTransactionObservation_UNSTABLE()`**.  (***NOTE***: *This API is currently under development*).

The subscription callback provides all of the atom state and tells you which atoms changed.  From this you can save the changes with the storage and serialization of your preference.  Here is an example of a basic implementation using JSON:

```jsx
function PersistenceObserver() {
  useTransactionObservation_UNSTABLE(({atomValues, atomInfo, modifiedAtoms}) => {
    for (const modifiedAtom of modifiedAtoms) {
      Storage.setItem(
        modifiedAtom,
        JSON.stringify({value: atomValues.get(modifiedAtom)}),
      );
    }
  });
}
```

*Storage* could be the browser URL history, [*LocalStorage*](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), *[AsyncStorage](https://github.com/react-native-community/react-native-async-storage)* or whichever storage you like.

* *`atomValues`* - A Map of the atom keys and values.
* *`modifiedAtoms`* - Gives you a map containing the modified atoms.
* *`atomInfo`* - Atom metadata.

You may not wish to persist all atoms, or some atoms may have different persistence behaviors.  You can read metadata (***NOTE***: *new API coming soon*) to get options from each atom.

Note that the current hook was designed for persistence and only reports atoms with special option (property `persistence_UNSTABLE` which is an object with a non-null `type` property)

## Restoring State

After you ensure that you're saving your state to your storage, you need to recover it when loading the app.  This can be done using the **`initializeState`** prop on thee **`<RecoilRoot>`** component. (***NOTE***: *API changes coming soon*).

`initializeState` is a function that provides a **`set`** method to provide the initial atom value for an atom key.
Pass the key for the atom and the stored value to this callback and it will initialize the atom to the restored state.

Note that it is important to use this prop instead of just manually setting atom values in an effect.  Otherwise there will be an initial render without the restored state which can cause flicker or be invalid.

Here is a basic example:

```jsx
const initializeState = ({set}) => {
  for(const [key, value] of Storage.entries()) {
    set(getAtomWithKey(key), JSON.parse(value)).value;
  }
}

return (
  <RecoilRoot initializeState={initializeState}>
    <PersistenceObserver />
    <SomeComponent />
  </RecoilRoot>
);
```

## Syncing State

You may also wish for asynchronous updates of the storage, such as the user pressing the browser back button with URL persistence, to sync with the current app state.  You can use a React effect to subscribe to these changes and update the value of any modified atoms directly.

*Example coming soon...*

## Backward-Compatibility and Value Validation

What if your state storage is not reliable?  Or what if you change which atoms or types you are using and need to work with previously persisted state?  More documentation and examples on how to handle this coming soon as the API is finalized...
