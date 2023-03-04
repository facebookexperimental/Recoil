---
title: selector(options)
sidebar_label: selector()
---

*Selectors* represent a function, or **derived state** in Recoil.  You can think of them as similar to an "idempotent" or "pure function" without side-effects that always returns the same value for a given set of dependency values.  If only a `get` function is provided, the selector is read-only and returns a `RecoilValueReadOnly` object.  If a `set` is also provided, it returns a writable `RecoilState` object.

Recoil manages atom and selector state changes to know when to notify components subscribing to that selector to re-render.  If an object value of a selector is mutated directly it may bypass this and avoid properly notifying subscribing components.  To help detect bugs, Recoil will freeze selector value objects in development mode.

---
```jsx
function selector<T>({
  key: string,

  get: ({
    get: GetRecoilValue,
    getCallback: GetCallback,
  }) => T | Promise<T> | Loadable<T> | WrappedValue<T> | RecoilValue<T>,

  set?: (
    {
      get: GetRecoilValue,
      set: SetRecoilState,
      reset: ResetRecoilState,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,
  cachePolicy_UNSTABLE?: CachePolicy,
})
```

```jsx
type ValueOrUpdater<T> = T | DefaultValue | ((prevValue: T) => T | DefaultValue);
type GetCallback =
  <Args, Return>(
    callback: CallbackInterface => (...Args) => Return,
  ) => (...Args) => Return;

type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilState = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
type ResetRecoilState = <T>(RecoilState<T>) => void;

type CachePolicy =
  | {eviction: 'lru', maxSize: number}
  | {eviction: 'keep-all'}
  | {eviction: 'most-recent'};
```

- `key` - A unique string used to identify the selector internally. This string should be unique with respect to other atoms and selectors in the entire application.  It needs to be stable across executions if used for persistence.
- `get` - A function that evaluates the value for the derived state.  It may return either a value directly, an asynchronous `Promise`, a `Loadable`, or another atom or selector representing the same type.  To set the selector value directly to something like a `Promise` or `Loadable`, you can wrap it with `selector.value(...)`.  This callback is passed an object as the first parameter containing the following properties:
  - `get()` - a function used to retrieve values from other atoms/selectors. All atoms/selectors passed to this function will be implicitly added to a list of **dependencies** for the selector. If any of the selector's dependencies change, the selector will re-evaluate.
  - `getCallback()` - a function for creating Recoil-aware callbacks with a [callback interface](/docs/api-reference/core/useRecoilCallback#callback-interface).  See [example](/docs/api-reference/core/selector#returning-objects-with-callbacks) below.
- `set?` - If this property is set, the selector will return **writable** state. A function that is passed an object of callbacks as the first parameter and the new incoming value.  The incoming value may be a value of type `T` or maybe an object of type `DefaultValue` if the user reset the selector.  The callbacks include:
  - `get()` - a function used to retrieve values from other atoms/selectors. This function will not subscribe the selector to the given atoms/selectors.
  - `set()` - a function used to set the values of upstream Recoil state. The first parameter is the Recoil state and the second parameter is the new value.  The new value may be an updater function or a `DefaultValue` object to propagate reset actions.
  - `reset()` - a function used to reset to the default values of upstream Recoil state. The only parameter is the Recoil state.
- `dangerouslyAllowMutability` - In some cases it may be desirable allow mutating of objects stored in selectors that don't represent state changes.  Use this option to override freezing objects in development mode.
- `cachePolicy_UNSTABLE` - Defines the behavior of the internal selector cache. Can be useful to control the memory footprint in apps that have selectors with many changing dependencies.
  - `eviction` - can be set to `lru` (which requires that a `maxSize` is set), `keep-all` (default), or `most-recent`. An `lru` cache will evict the least-recently-used value from the selector cache when the size of the cache exceeds `maxSize`. A `keep-all` policy will mean all selector dependencies and their values will be indefinitely stored in the selector cache. A `most-recent` policy will use a cache of size 1 and will retain only the most recently saved set of dependencies and their values.
  - Note the cache stores the values of the selector based on a key containing all dependencies and their values. This means the size of the internal selector cache depends on both the size of the selector values as well as the number of unique values of all dependencies.
  - Note the default eviction policy (currently `keep-all`) may change in the future.

---

A selector with a simple static dependency:

```jsx
const mySelector = selector({
  key: 'MySelector',
  get: ({get}) => get(myAtom) * 100,
});
```

### Dynamic Dependencies

A read-only selector has a `get` method which evaluates the value of the selector based on dependencies.  If any of those dependencies are updated, then the selector will re-evaluate.  The dependencies are dynamically determined based on the atoms or selectors you actually use when evaluating the selector.  Depending on the values of the previous dependencies, you may dynamically use different additional dependencies.  Recoil will automatically update the current data-flow graph so that the selector is only subscribed to updates from the current set of dependencies

In this example `mySelector` will depend on the `toggleState` atom as well as either `selectorA` or `selectorB` depending on the state of `toggleState`.
```jsx
const toggleState = atom({key: 'Toggle', default: false});

const mySelector = selector({
  key: 'MySelector',
  get: ({get}) => {
    const toggle = get(toggleState);
    if (toggle) {
      return get(selectorA);
    } else {
      return get(selectorB);
    }
  },
});
```

### writable Selectors

A bi-directional selector receives the incoming value as a parameter and can use that to propagate the changes back upstream along the data-flow graph.  Because the user may either set the selector with a new value or reset the selector, the incoming value is either of the same type that the selector represents or a `DefaultValue` object which represents a reset action.

This simple selector essentially wraps an atom to add an additional field.  It just passes through set and reset operations to the upstream atom.
```jsx
const proxySelector = selector({
  key: 'ProxySelector',
  get: ({get}) => ({...get(myAtom), extraField: 'hi'}),
  set: ({set}, newValue) => set(myAtom, newValue),
});
```

This selector transforms the data, so it needs to check if the incoming value is a `DefaultValue`.
```jsx
const transformSelector = selector({
  key: 'TransformSelector',
  get: ({get}) => get(myAtom) * 100,
  set: ({set}, newValue) =>
    set(myAtom, newValue instanceof DefaultValue ? newValue : newValue / 100),
});
```

### Asynchronous Selectors

Selectors may also have asynchronous evaluation functions and return a `Promise` to the output value.  Please see [this guide](/docs/guides/asynchronous-data-queries) for more information.

```jsx
const myQuery = selector({
  key: 'MyQuery',
  get: async ({get}) => {
    return await myAsyncQuery(get(queryParamState));
  }
});
```

### Example (Synchronous)

```jsx
import {atom, selector, useRecoilState, DefaultValue, useResetRecoilState} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelsius = selector({
  key: 'tempCelsius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) =>
    set(
      tempFahrenheit,
      newValue instanceof DefaultValue ? newValue : (newValue * 9) / 5 + 32
    ),
});

function TempCelsius() {
  const [tempF, setTempF] = useRecoilState(tempFahrenheit);
  const [tempC, setTempC] = useRecoilState(tempCelsius);
  const resetTemp = useResetRecoilState(tempCelsius);

  const addTenCelsius = () => setTempC(tempC + 10);
  const addTenFahrenheit = () => setTempF(tempF + 10);
  const reset = () => resetTemp();

  return (
    <div>
      Temp (Celsius): {tempC}
      <br />
      Temp (Fahrenheit): {tempF}
      <br />
      <button onClick={addTenCelsius}>Add 10 Celsius</button>
      <br />
      <button onClick={addTenFahrenheit}>Add 10 Fahrenheit</button>
      <br />
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Example (Asynchronous)

```jsx
import {selector, useRecoilValue} from 'recoil';

const myQuery = selector({
  key: 'MyDBQuery',
  get: async () => {
    const response = await fetch(getMyRequestUrl());
    return response.json();
  },
});

function QueryResults() {
  const queryResults = useRecoilValue(myQuery);

  return (
    <div>
      {queryResults.foo}
    </div>
  );
}

function ResultsSection() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <QueryResults />
    </React.Suspense>
  );
}
```
Please see [this guide](/docs/guides/asynchronous-data-queries) for more complex examples.

### Returning objects with callbacks

Sometimes selectors can be used to return objects that contain callbacks.  It may be helpful for these callbacks to access Recoil state, such as for querying typeahead values or click handlers.  The following example uses a selector to generate menu items with a click handler that accesses Recoil state.  This can be useful when passing these objects to frameworks or logic outside the context of a React component.

There is symmetry between this callback and using [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback).  Note that the callback returned by `getCallback()` can be used as an async callback to access Recoil state later, it should not be called during the evaluation of the selector value itself.

```jsx
const menuItemState = selectorFamily({
  key: 'MenuItem',
  get: itemID => ({get, getCallback}) => {
    const name = get(itemNameQuery(itemID));
    const onClick = getCallback(({snapshot}) => async () => {
      const info = await snapshot.getPromise(itemInfoQuery(itemID));
      displayInfoModal(info);
    });
    return {
      title: `Show info for ${name}`,
      onClick,
    };
  },
});
```

Example that can mutate state:

```jsx
const menuItemState = selectorFamily({
  key: 'MenuItem',
  get: itemID => ({get, getCallback}) => {
    const name = get(itemNameQuery(itemID));
    const onClick = getCallback(({refresh}) => () => {
      refresh(itemInfoQuery(itemID));
    });
    return {
      title: `Refresh data for ${name}`,
      onClick,
    };
  },
});
```

## Cache policy configuration

The `cachePolicy_UNSTABLE` property allows you to configure the caching behavior of a selector's internal cache. This property can be useful for reducing memory in applications that have a large number of selectors that have a large number of changing dependencies. For now the only configurable option is `eviction`, but we may add more in the future.

Below is an example of how you might use this new property:

```jsx
const clockState = selector({
  key: 'clockState',
  get: ({get}) => {
    const hour = get(hourState);
    const minute = get(minuteState);
    const second = get(secondState); // will re-run every second

    return `${hour}:${minute}:${second}`;
  },
  cachePolicy_UNSTABLE: {
    // Only store the most recent set of dependencies and their values
    eviction: 'most-recent',
  },
});
```

In the example above, `clockState` recalculates every second, adding a new set of dependency values to the internal cache, which may lead to a memory issue over time as the internal cache grows indefinitely. Using the `most-recent` eviction policy, the internal selector cache will only retain the most recent set of dependencies and their values, along with the actual selector value based on those dependencies, thus solving the memory issue.

Current eviction options are:
- `lru` - evicts the least-recently-used value from the cache when the size exceeds `maxSize`.
- `most-recent` - retains only the most recent value.
- `keep-all` (*default*) - keeps all entries in the cache and does not evict.

> **_NOTE:_** *The default eviction policy (currently `keep-all`) may change in the future.*
