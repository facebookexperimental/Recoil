---
title: selector(options)
sidebar_label: selector()
---

*Selectors* represent a function, or **derived state** in Recoil.  You can think of them as a "pure function" without side-effects that always returns the same value for a given set of dependency values.  If only a `get` function is provided, the selector is read-only and returns a `RecoilValueReadOnly` object.  If a `set` is also provided, it returns a writeable `RecoilState` object.

---

```jsx
function selector<T>({
  key: string,

  get: ({
    get: GetRecoilValue
  }) => T | Promise<T> | RecoilValue<T>,

  set?: (
    {
      get: GetRecoilValue,
      set: SetRecoilState,
      reset: ResetRecoilState,
    },
    newValue: T | DefaultValue,
  ) => void,

  dangerouslyAllowMutability?: boolean,
})
```

```jsx
type ValueOrUpdater<T> = T | DefaultValue | ((prevValue: T) => T | DefaultValue);
type GetRecoilValue = <T>(RecoilValue<T>) => T;
type SetRecoilState = <T>(RecoilState<T>, ValueOrUpdater<T>) => void;
type ResetRecoilState = <T>(RecoilState<T>) => void;
```

- `key` - A unique string used to identify the atom internally. This string should be unique with respect to other atoms and selectors in the entire application.  It needs to be stable across executions if used for persistence.
- `get` - A function that evaluates the value for the derived state.  It may return either a value directly or an asynchronous `Promise` or another atom or selector representing the same type.  It is passed an object as the first parameter containing the following properties:
  - `get` - a function used to retrieve values from other atoms/selectors. All atoms/selectors passed to this function will be implicitly added to a list of **dependencies** for the selector. If any of the selector's dependencies change, the selector will re-evaluate.
- `set?` - If this property is set, the selector will return **writeable** state. A function that is passed an object of callbacks as the first parameter and the new incoming value.  The incoming value may be a value of type `T` or maybe an object of type `DefaultValue` if the user reset the selector.  The callbacks include:
  - `get` - a function used to retrieve values from other atoms/selectors. This function will not subscribe the selector to the given atoms/selectors.
  - `set` - a function used to set the values of upstream Recoil state. The first parameter is the Recoil state and the second parameter is the new value.  The new value may be an updater function or a `DefaultValue` object to propagate reset actions.
- `dangerouslyAllowMutability` - Selectors represent "pure functions" of derived state and should always return the same value for the same set of dependency input values.  To help protect this all values stored in a selector are frozen by default.  In some cases this may need to be overridden using this option.

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

### Writeable Selectors

A bi-directional selector receives the incoming value as a parameter and can use that to propagate the changes back upstream along the data-flow graph.  Because the user may either set the selector with a new value or reset the selector, the incoming value is either of the same type that the selector represents or a `DefaultValue` object which represents a reset action.

This simple selector essentially wraps an atom to add an additional field.  It just passes through set and reset operations to the upstream atom.
```jsx
const proxySelector = selector({
  key: 'ProxySelector',
  get: ({get}) => ({...get(myAtom), extraField: 'hi'}),
  set: ({set}, newValue) => set(myAtom, newValue),
});
```

This selector transforms the data, so needs to check if the incoming value is a `DefaultValue`.
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
import {atom, selector, useRecoilState} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelcius = selector({
  key: 'tempCelcius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) =>
    set(
      tempFahrenheit,
      neValue instanceof DefaultValue ? newValue : (newValue * 9) / 5 + 32
    ),
});

function TempCelcius() {
  const [tempF, setTempF] = useRecoilState(tempFahrenheit);
  const [tempC, setTempC] = useRecoilState(tempCelcius);
  const resetTemp = useResetRecoilState(tempCelcius);

  const addTenCelcius = () => setTempC(tempC + 10);
  const addTenFahrenheit = () => setTempF(tempF + 10);
  const reset = () => resetTemp();

  return (
    <div>
      Temp (Celcius): {tempC}
      <br />
      Temp (Fahrenheit): {tempF}
      <br />
      <button onClick={addTenCelcius}>Add 10 Celcius</button>
      <br />
      <button onClick={addTenFahrenheit}>Add 10 Fahrenheit</button>
      <br />
      <button onClick={reset}>>Reset</button>
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
    return myDBQueryPromise();
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
