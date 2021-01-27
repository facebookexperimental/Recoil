---
title: Atom Effects
sidebar_label: Atom Effects
---

Atom Effects are a new experimental API for managing side-effects and initializing Recoil atoms.  They have a variety of useful applications such as state persistence, state synchronization, managing history, logging, &c.  They are defined as part of the atom definition, so each atom can specify and compose their own policies.  This API is still evolving, and thus marked as `_UNSTABLE`.

----
## *IMPORTANT NOTE*
***This API is currently under development and will change.  Please stay tuned...***

----

An *atom effect* is a *function* with the following definition.

```jsx
type AtomEffect<T> = ({
  node: RecoilState<T>, // A reference to the atom itself
  trigger: 'get' | 'set', // The action which triggered initialization of the atom

  // Callbacks to set or reset the value of the atom.
  // This can be called from the atom effect function directly to initialize the
  // initial value of the atom, or asynchronously called later to change it.
  setSelf: (
    | T
    | DefaultValue
    | Promise<T | DefaultValue> // Only allowed for initialization at this time
    | ((T | DefaultValue) => T | DefaultValue),
  ) => void,
  resetSelf: () => void,

  // Subscribe to changes in the atom value.
  // The callback is not called due to changes from this effect's own setSelf().
  onSet: (
    (newValue: T | DefaultValue, oldValue: T | DefaultValue) => void,
  ) => void,

}) => void | () => void; // Optionally return a cleanup handler
```

Atom effects are attached to [atoms](/docs/api-reference/core/atom) via the `effects_UNSTABLE` option.  Each atom can reference an array of these atom effect functions which are called in priority order when the atom is initialized.  Atoms are initialized when they are used for the first time within a `<RecoilRoot>`, but may be re-initialized again if they were unused and cleaned up.  The atom effect function may return an optional cleanup handler to manage cleanup side-effects.

```jsx
const myState = atom({
  key: 'MyKey',
  default: null,
  effects_UNSTABLE: [
    () => {
      ...effect 1...
      return () => ...cleanup effect 1...;
    },
    () => { ...effect 2... },
  ],
});
```

[Atom families](/docs/api-reference/utils/atomFamily) also support parameterized or non-parameterized effects:

```jsx
const myStateFamily = atomFamily({
  key: 'MyKey',
  default: null,
  effects_UNSTABLE: param => [
    () => {
      ...effect 1 using param...
      return () => ...cleanup effect 1...;
    },
    () => { ...effect 2 using param... },
  ],
});
```

### Compared to React Effects

Atom effects could mostly be implemented via React `useEffect()`.  However, the set of atoms are created outside of a React context, and it can be difficult to manage effects from within React components, particularly for dynamically created atoms.  They also cannot be used to initialize the initial atom value or be used with server-side rendering.  Using atom effects also co-locates the effects with the atom definitions.

```jsx
const myState = atom({key: 'Key', default: null});

function MyStateEffect(): React.Node {
  const [value, setValue] = useRecoilState(myState);
  useEffect(() => {
    // Called when the atom value changes
    store.set(value);
    store.onChange(setValue);
    return () => { store.onChange(null); }; // Cleanup effect
  }, [value]);
  return null;
}

function MyApp(): React.Node {
  return (
    <div>
      <MyStateEffect />
      ...
    </div>
  );
}
```

### Compared to Snapshots

The [`Snapshot hooks`](/docs/api-reference/core/Snapshot#hooks) API can also monitor atom state changes and the `initializeState` prop in [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) can initialize values for initial render. However, these APIs monitor all state changes and can be awkward to manage dynamic atoms, particularly atom families.  With atom effects, the side-effect can be defined per-atom alongside the atom definition and multiple policies can be easily composed.

## Logging Example

A simple example of using atom effects are for logging a specific atom's state changes.

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: null,
  effects_UNSTABLE: [
    ({onSet}) => {
      onSet(newID => {
        console.debug("Current user ID:", newID);
      });
    },
  ],
});
```

## History Example

A more complex example of logging might maintain a history of changes.  This example provides an effect which maintains a history queue of state changes with callback handlers that undo that particular change:

```jsx
const history: Array<{
  label: string,
  undo: () => void,
}> = [];

const historyEffect = name => ({setSelf, onSet}) => {
  onSet((newValue, oldValue) => {
    history.push({
      label: `${name}: ${JSON.serialize(oldValue)} -> ${JSON.serialize(newValue)}`,
      undo: () => {
        setSelf(oldValue);
      },
    });
  });
};

const userInfoState = atomFamily({
  key: 'UserInfo',
  default: null,
  effects_UNSTABLE: userID => [
    historyEffect(`${userID} user info`),
  ],
});
```

## State Synchronization Example

It can be useful to use atoms as a local cached value of some other state such as a remote database, local storage, &c.  You could set the default value of an atom using the `default` property with a selector to get the store's value.  However, that is only a one-time lookup; if the store's value changes the atom value will not change.  With effects, we can subscribe to the store and update the atom's value whenever the store changes.  Calling `setSelf()` from the effect will initialize the atom to that value and will be used for the initial render.  If the atom is reset, it will revert to the `default` value, not the initialized value.

```jsx
const syncStorageEffect = userID => ({setSelf, trigger}) => {
  // Initialize atom value to the remote storage state
  if (trigger === 'get') { // Avoid expensive initialization
    setSelf(myRemoteStorage.get(userID)); // Call synchronously to initialize
  }

  // Subscribe to remote storage changes and update the atom value
  myRemoteStorage.onChange(userID, userInfo => {
    setSelf(userInfo); // Call asynchronously to change value
  });

  // Cleanup remote storage subscription
  return () => {
    myRemoteStorage.onChange(userID, null);
  };
};

const userInfoState = atomFamily({
  key: 'UserInfo',
  default: null,
  effects_UNSTABLE: userID => [
    historyEffect(`${userID} user info`),
    syncStorageEffect(userID),
  ],
});
```

## Write-Through Cache Example

We can also bi-directionally sync atom values with remote storage so changes on the server update the atom value and changes in the local atom are written back to the server.  The effect will not call the `onSet()` handler when changed via that effect's `setSelf()` to help avoid feedback loops.

```jsx
const syncStorageEffect = userID => ({setSelf, onSet, trigger}) => {
  // Initialize atom value to the remote storage state
  if (trigger === 'get') { // Avoid expensive initialization
    setSelf(myRemoteStorage.get(userID)); // Call synchronously to initialize
  }

  // Subscribe to remote storage changes and update the atom value
  myRemoteStorage.onChange(userID, userInfo => {
    setSelf(userInfo); // Call asynchronously to change value
  });

  // Subscribe to local changes and update the server value
  onSet(userInfo => {
    myRemoteStorage.set(userID, userInfo);
  });

  // Cleanup remote storage subscription
  return () => {
    myRemoteStorage.onChange(userID, null);
  };
};
```

## Local Storage Persistence

Atom effects can be used to persist atom state with [browser local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). `localStorage` is synchronous, so we can retrieve the data directly without `async` `await` or a `Promise`.

Note that the following examples are simplified for illustrative purposes and do not cover all cases.

```jsx
const localStorageEffect = key => ({setSelf, onSet}) => {
  const savedValue = localStorage.getItem(key)
  if (savedValue != null) {
    setSelf(JSON.parse(savedValue));
  }

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect('current_user'),
  ]
});
```

## Asynchronous Storage Persistence

If your persisted data needs to be retrieved asynchronously, you can either use a [`Promise`](#promise) in the `setSelf()` function or create an [asynchronous](#asynchronous) function and call that.

### `Promise`

By synchronously calling `setSelf()` with a `Promise` you'll be able to wrap the components inside of the `<RecoilRoot/>` with a `<Suspense/>` component to show a fallback while waiting for `Recoil` to load the persisted values.

The `<Suspense/>` fallback will be shown until the `setSelf()` function has been called.

Note that if the `atoms` later are "reset", they will revert to their default value, and not the initialized value.

```jsx
const localStorageEffect = key => ({setSelf, onSet}) => {
  setSelf(
    localStorage.getItem(key).then((savedValue) => {
      if (savedValue != null) {
        return JSON.parse(savedValue);
      }
    }),
  );

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect('current_user'),
  ]
});
```


### Asynchronous

Using an asynchronous function your `atoms`, `selectors` etc, will use their default value until the deferred `setSelf()` has been called to set the value.

Unlike using a `Promise`, it is not possible to use `<Suspense/>` to show a fallback.

This approach isn't just limited to `await`, but for any `async` usage of `setSelf()`, such as `setTimeout()`.

### `AsyncLocalStorage`/`localForage` example

```jsx
const localForageEffect = key => ({setSelf, onSet}) => {
  /** If there's a persisted value - set it on load  */
  const loadPersisted = async () => {
    const savedValue = await localForage.getItem(key);

    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }
  };

  // Load the persisted data
  loadPersisted()

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localForage.removeItem(key);
    } else {
      localForage.setItem(key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localForageEffect('current_user'),
  ]
});
```

### Backward Compatibility

What if you change the format for an atom?  Loading a page with the new format with a `localStorage` based on the old format could case a problem.  You could build effects to handle restoring and validating the value in a type safe way:

```jsx
type PersistenceOptions<T>: {
  key: string,
  restorer: (mixed, DefaultValue) => T | DefaultValue,
};

const localStorageEffect = <T>(options: PersistenceOptions<T>) => ({setSelf, onSet}) => {
  const savedValue = localStorage.getItem(options.key)
  if (savedValue != null) {
    setSelf(options.restorer(JSON.parse(savedValue), new DefaultValue()));
  }

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(options.key);
    } else {
      localStorage.setItem(options.key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom<number>({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect({
      key: 'current_user',
      restorer: (value, defaultValue) =>
        // values are currently persisted as numbers
        typeof value === 'number'
          ? value
          // if value was previously persisted as a string, parse it to a number
          : typeof value === 'string'
          ? parseInt(value, 10)
          // if type of value is not recognized, then use the atom's default value.
          : defaultValue
    }),
  ],
});
```

What if the key used to persist the value changes?  Or what used to be persisted using one key now uses several?  Or vice versa?  That can also be handled in a type-safe way:

```jsx
type PersistenceOptions<T>: {
  key: string,
  restorer: (mixed, DefaultValue, Map<string, mixed>) => T | DefaultValue,
};

const localStorageEffect = <T>(options: PersistenceOptions<T>) => ({setSelf, onSet}) => {
  const savedValues = parseValuesFromStorage(localStorage);
  const savedValue = savedValues.get(options.key);
  setSelf(
    options.restorer(savedValue ?? new DefaultValue(), new DefaultValue(), savedValues),
  );

  onSet(newValue => {
    if (newValue instanceof DefaultValue) {
      localStorage.removeItem(options.key);
    } else {
      localStorage.setItem(options.key, JSON.stringify(newValue));
    }
  });
};

const currentUserIDState = atom<number>({
  key: 'CurrentUserID',
  default: 1,
  effects_UNSTABLE: [
    localStorageEffect({
      key: 'current_user',
      restorer: (value, defaultValue, values) => {
        if (typeof value === 'number') {
          return value;
        }

        const oldValue = values.get('old_key');
        if (typeof oldValue === 'number') {
          return oldValue;
        }

        return defaultValue;
      },
    }),
  ],
});
```

## Browser URL History Persistence

Atom state can also be persisted and synced with the browser URL history.  This can be useful to have state changes update the current URL so it can be saved or shared with others to restore that state.  It can also be integrated with the browser history to leverage the browser forward/back buttons.  *Examples or a library to provide this type of persistence are coming soon...*
