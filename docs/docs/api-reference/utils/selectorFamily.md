---
title: selectorFamily(options)
sidebar_label: selectorFamily()
---

Returns a function that returns a read-only `RecoilValueReadOnly` or writeable `RecoilState` selector.

A `selectorFamily` is a powerful pattern that is similar to a [`selector`](/docs/api-reference/core/selector), but allows you to pass parameters to the `get` and `set` callbacks of a `selector`.  The `selectorFamily()` utility returns a function which can be called with user-defined parameters and returns a selector. Each unique parameter value will return the same memoized selector instance.

---
Read-only selector family:
```jsx
function selectorFamily<T, P: Parameter>({
  key: string,

  get: P => ({
    get: GetRecoilValue
    getCallback: GetCallback<T>,
  }) =>
    T | Promise<T> | Loadable<T> | WrappedValue<T> | RecoilValue<T>,

  dangerouslyAllowMutability?: boolean,
}): P => RecoilValueReadOnly<T>
```

Writable selector family:
```jsx
function selectorFamily<T, P: Parameter>({
  key: string,

  get: P => ({
    get: GetRecoilValue
    getCallback: GetCallback<T>,
  }) =>
    T | Promise<T> | Loadable<T> | WrappedValue<T> | RecoilValue<T>,

  set: P => (
    {
      get: GetRecoilValue,
      set: SetRecoilValue,
      reset: ResetRecoilValue,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,

  cachePolicy_UNSTABLE?: CachePolicy,
}): P => RecoilState<T>
```

Where

```jsx
type ValueOrUpdater<T> =  T | DefaultValue | ((prevValue: T) => T | DefaultValue);

type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilValue = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
type ResetRecoilValue = <T>(RecoilState<T>) => void;

type GetCallback<T> =
  <Args, Return>(
    callback: ({node: RecoilState<T>, ...CallbackInterface}) => (...Args) => Return,
  ) => (...Args) => Return;

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

The `selectorFamily()` essentially provides a map from the parameter to a selector.  You only need to provide a single key for the atom family and it will generate a unique key for each underlying selector.

## Parameter Type
```jsx
type Primitive = void | null | boolean | number | string;
interface HasToJSON {
  toJSON(): Parameter;
}
type Parameter =
  | Primitive
  | HasToJSON
  | $ReadOnlyArray<Parameter>
  | $ReadOnly<{[string]: Parameter}>
  | $ReadOnlySet<Parameter>
  | $ReadOnlyMap<Parameter, Parameter>;
```
There are restrictions on the type you can use as the family `Parameter`.  They may be generated at different callsites and we want equivalent parameters to reference the same underlying selector.  Therefore, parameters are compared using value-equality and must be serializable.  Using functions or mutable objects, such as Promises, in parameters is problematic.  To be serializable it must be either:
  * A primitive value
  * An array, object, `Map`, or `Set` of serializable values
  * Contain a `toJSON()` method which returns a serializable value, similar to `JSON.stringify()`

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
    set(formState, prevState => ({...prevState, [field]: newValue})),
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

## Cache policy configuration

The `cachePolicy_UNSTABLE` property allows you to configure the caching behavior of **individual selectors** that make up the family. This property can be useful for reducing memory in applications that have a large number of selectors that have a large number of changing dependencies.  Please see the [selector cache policy configuration documentation](/docs/api-reference/core/selector#cache-policy-configuration).
