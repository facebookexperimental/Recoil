---
title: selectorFamily()
sidebar_label: selectorFamily()
---

Returns a function that returns a read-only `RecoilValueReadOnly` or writeable `RecoilState` selector.

A `selectorFamily` is a powerful pattern that is similar to a `selector`, but allows you to pass parameters to the `get` and `set` callbacks of a `selector`.

```jsx
function selectorFamily<T, Parameter>({
  key: string,

  get: Parameter => ({get: GetRecoilValue}) => Promise<T> | RecoilValue<T> | T,

  dangerouslyAllowMutability?: boolean,
}): RecoilValueReadOnly<T>
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
}): RecoilState<T>
```

Where

```jsx
type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilValue = <T>(
  RecoilState<T>,
  T | DefaultValue | ((prevValue: T) => T | DefaultValue),
) => void;
type ResetRecoilValue = <T>(RecoilState<T>) => void;
```

---

The `selectorFamily()` utility returns a function which can be called with user-defined parameters and returns a selector. Each unique parameter value will return the same memoized selector instance.

- `options`
  - `key`: A unique string used to identify the atom internally. This string should be unique with respect to other atoms and selectors in the entire application.
  - `get`: A function that is passed an object of named callbacks that returns the value of the selector, the same as the `selector()` interface. This is wrapped by a function which is passed the parameter from calling the selector family function.
  - `set?`: An optional function that will produce writeable selectors when provided. It should be a function that takes an object of named callbacks, same as the `selector()` interface. This is again wrapped by another function with gets the parameters from calling the selector family function.

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

## Query Example

Selector Families are also useful to use for passing parameters to queries:

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
