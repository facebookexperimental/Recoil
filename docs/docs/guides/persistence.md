---
title: State Persistence
sidebar_label: State Persistence
---

Recoil allows you to persist application state using atoms.

---

## _IMPORTANT NOTE_

**_This API is currently under development and will change. Please stay tuned..._**

---

## Saving State

To save state, subscribe to atom changes and record the new state. You could use React effects to subscribe to individual atoms (_See [Asynchronous State Sync](asynchronous-state-sync)_). However, Recoil provides a hook to allow you to subscribe to state changes for all atoms using **`useTransactionObservation_UNSTABLE()`**. (**_NOTE_**: _This API is currently under development_).

The subscription callback provides all of the atom state and tells you which atoms changed. From this you can save the changes with the storage and serialization of your preference. Here is an example of a basic implementation using JSON:

```jsx
function PersistenceObserver() {
  useTransactionObservation_UNSTABLE(
    ({atomValues, atomInfo, modifiedAtoms}) => {
      for (const modifiedAtom of modifiedAtoms) {
        Storage.setItem(
          modifiedAtom,
          JSON.stringify({value: atomValues.get(modifiedAtom)}),
        );
      }
    },
  );
}
```

_Storage_ could be the browser URL history, [_LocalStorage_](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), _[AsyncStorage](https://github.com/react-native-community/react-native-async-storage)_ or whichever storage you like.

- _`atomValues`_ - A Map of the atom keys and values.
- _`modifiedAtoms`_ - Gives you a map containing the modified atoms.
- _`atomInfo`_ - Atom metadata.

You may not wish to persist all atoms, or some atoms may have different persistence behaviors. You can read metadata (**_NOTE_**: _new API coming soon_) to get options from each atom.

Note that the current hook was designed for persistence and only reports atoms with special option (property `persistence_UNSTABLE` which is an object with a non-null `type` property)

## Restoring State

After you ensure that you're saving your state to your storage, you need to recover it when loading the app. This can be done using the **`initializeState`** prop on the **`<RecoilRoot>`** component. (**_NOTE_**: _API changes coming soon_).

`initializeState` is a function that provides a **`set`** method to provide the initial atom value for an atom key. Pass the key for the atom and the stored value to this callback and it will initialize the atom to the restored state.

Note that it is important to use this prop instead of just manually setting atom values in an effect. Otherwise there will be an initial render without the restored state which can cause flicker or be invalid.

Here is a basic example:

```jsx
const initializeState = ({set}) => {
  for (const [key, value] of Storage.entries()) {
    set(getAtomWithKey(key), JSON.parse(value).value);
  }
};

return (
  <RecoilRoot initializeState={initializeState}>
    <PersistenceObserver />
    <SomeComponent />
  </RecoilRoot>
);
```

## Syncing State

You may also wish for asynchronous updates of the storage, such as the user pressing the browser back button with URL persistence, to sync with the current app state. You can use a React effect to subscribe to these changes and update the value of any modified atoms directly.

_Example coming soon..._

## Backward-Compatibility and Value Validation

What if your state storage is not reliable? Or what if you change which atoms or types you are using and need to work with previously persisted state? More documentation and examples on how to handle this coming soon as the API is finalized...
