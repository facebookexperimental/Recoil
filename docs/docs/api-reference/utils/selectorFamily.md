---
title: selectorFamily(options)
sidebar_label: selectorFamily()
---

Returns a function that returns a read-only `RecoilValueReadOnly` or writeable `RecoilState` selector.

A `selectorFamily` is a powerful pattern that is similar to a [`selector`](/docs/api-reference/core/selector), but allows you to pass parameters to the `get` and `set` callbacks of a `selector`.  The `selectorFamily()` utility returns a function which can be called with user-defined parameters and returns a selector. Each unique parameter value will return the same memoized selector instance.

---

```jsx
function selectorFamily<T, Parameter>({
  key: string,

  get: Parameter => ({get: GetRecoilValue}) => Promise<T> | RecoilValue<T> | T,

  dangerouslyAllowMutability?: boolean,
}): Parameter => RecoilValueReadOnly<T>
```

```jsx
function selectorFamily<T, Parameter>({
  key: string,

  get: Parameter => ({get: GetRecoilValue}) => Promise<T> | RecoilValue<T> | T,

  set: Parameter => (
    {
      get: GetRecoilValue,
      set: SetRecoilValue,
      reset: ResetRecoilValue,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,

  cachePolicy_UNSTABLE?: CachePolicy,
}): Parameter => RecoilState<T>
```

Where

```jsx
type ValueOrUpdater<T> =  T | DefaultValue | ((prevValue: T) => T | DefaultValue);
type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilValue = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
type ResetRecoilValue = <T>(RecoilState<T>) => void;

type CachePolicy = 
  | {eviction: 'lru', maxSize: number}
  | {eviction: 'keep-all'}
  | {eviction: 'most-recent'};
```

- `key` - A unique string used to identify the atom internally. This string should be unique with respect to other atoms and selectors in the entire application.
- `get` - A function that is passed an object of named callbacks that returns the value of the selector, the same as the `selector()` interface. This is wrapped by a function which is passed the parameter from calling the selector family function.
- `set?` - An optional function that will produce writeable selectors when provided. It should be a function that takes an object of named callbacks, same as the `selector()` interface. This is again wrapped by another function with gets the parameters from calling the selector family function.
- `cachePolicy_UNSTABLE` - Defines the behavior of the internal selector cache for **the invidual selectors** that make up the family (it does not control the number of selectors that are stored in the family). Can be useful to control the memory footprint in apps that have selectors with many changing dependencies.
  - `eviction` - can be set to `lru` (which requires that a `maxSize` is set), `keep-all` (default), or `most-recent`. An `lru` cache will evict the least-recently-used value from the selector cache when the size of the cache exceeds `maxSize`. A `keep-all` policy will mean all selector dependencies and their values will be indefinitely stored in the selector cache. A `most-recent` policy will use a cache of size 1 and will retain only the most recently saved set of dependencies and their values.
  - Note the `maxSize` property used alongside `lru` does not control the max size of the family itself, it only controls the eviction policy used in the invidiual selectors that make up the family. 
  - Note the cache stores the values of the selector based on a key containing all dependencies and their values. This means the size of the internal selector cache depends on both the size of the selector values as well as the number of unique values of all dependencies.
  - Note the default eviction policy (currently `keep-all`) may change in the future.

---

The `selectorFamily` essentially provides a map from the parameter to a selector.  Because the parameters are often generated at the callsites using the family, and we want equivalent parameters to re-use the same underlying selector, it uses value-equality by default instead of reference-equality.  (There is an unstable API to adjust this behavior).  This imposes restrictions on the types which can be used for the parameter.  Please use a primitive type or an object that can be serialized.  Recoil uses a custom serializer that can support objects and arrays, some containers (such as ES6 Sets and Maps), is invariant of object key ordering, supports Symbols, Iterables, and uses `toJSON` properties for custom serialization (such as provided with libraries like Immutable containers).  Using functions or mutable objects, such as Promises, in parameters is problematic.

## Example

```jsx
const myNumberState = atom({
  key: 'MyNumber',
  default: 2,
});

const myMultipliedState = selectorFamily({
  key: 'MyMultipliedNumber',
  get: (multiplier) => ({get}) => {
    return get(myNumberState) * multiplier;
  },

  // optional set
  set: (multiplier) => ({set}, newValue) => {
    set(myNumberState, newValue / multiplier);
  },
});

function MyComponent() {
  // defaults to 2
  const number = useRecoilValue(myNumberState);

  // defaults to 200
  const multipliedNumber = useRecoilValue(myMultipliedState(100));

  return <div>...</div>;
}
```

## Async Query Example

Selector Families are also useful to use for passing parameters to queries.  Note that using a selector to abstract queries like this should still be "pure" functions which always return the same result for a given set of inputs and dependency values.  See [this guide](/docs/guides/asynchronous-data-queries) for more examples.

```jsx
const myDataQuery = selectorFamily({
  key: 'MyDataQuery',
  get: (queryParameters) => async ({get}) => {
    const response = await asyncDataRequest(queryParameters);
    if (response.error) {
      throw response.error;
    }
    return response.data;
  },
});

function MyComponent() {
  const data = useRecoilValue(myDataQuery({userID: 132}));
  return <div>...</div>;
}
```

## Destructuring Example

```jsx
const formState = atom({
  key: 'formState',
  default: {
    field1: "1",
    field2: "2",
    field3: "3",
  },
});

const formFieldState = selectorFamily({
  key: 'FormField',
  get: field => ({get}) => get(formState)[field],
  set: field => ({set}, newValue) =>
    set(formState, prevState => {...prevState, [field]: newValue}),
});

const Component1 = () => {
  const [value, onChange] = useRecoilState(formFieldState('field1'));
  return (
    <>
      <input value={value} onChange={onChange} />
      <Component2 />
    </>
  );
}

const Component2 = () => {
  const [value, onChange] = useRecoilState(formFieldState('field2'));
  return (
    <input value={value} onChange={onChange} />
  );
}
```

## Selector Cache Policy Configuration

The `cachePolicy_UNSTABLE` property allows you to configure the caching behavior of **individual selectors** that make up the family. This property can be useful for reducing memory in applications that have a large number of selectors that have a large number of changing dependencies. For now the only configurable option is `eviction`, but we may add more in the future.

Below is an example of how you might use this new property:

```jsx
const clockStateFamily = selectorFamily({
  key: 'clockState',
  get: (clockName) => ({get}) => {
    const hour = get(hourState);
    const minute = get(minuteState);
    const second = get(secondState); // will re-run every second

    return `${clockName} - ${hour}:${minute}:${second}`;
  },
  cachePolicy_UNSTABLE: {
    eviction: 'most-recent', // will only store the most recent set of dependencies and their values
  },
});
```

In the example above, each selector in the `clockStateFamily` recalculates every second (the number of selectors in the family will be dictated by the number of times the family is called with distinct `clockName`s). Each seccond, a new set of dependency values is added to the internal cache for each selector in the family, which may lead to a memory issue over time as the internal cache grows indefinitely. Using the `most-recent` eviction policy, the internal selector cache for each selector will only retain the most recent set of dependencies and their values, thus solving the memory issue.

Current eviction options are:
- `lru` - evicts the least-recently-used value from the cache when the cache size exceeds the given `maxSize`
- `most-recent` - retains only the most recent value and evicts any other values
- `keep-all` (default) - keeps all entries in the cache and does not evict

> **_NOTE:_** In this example, we used an eviction policy to control the cache of each selector in the family. This policy will not control the size of the family itself, so if you were to call `clockStateFamily()` with 10 million names, the family size will be 10 million regardless of the internal cache size of each individual selector.

> **_NOTE:_** The default eviciton policy (currently `keep-all`) may change in the future.
