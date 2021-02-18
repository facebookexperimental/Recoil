---
title: useRecoilState(state)
sidebar_label: useRecoilState()
---

Returns a tuple where the first element is the value of state and the second element is a setter function that will update the value of the given state when called.

This hook will implicitly subscribe the component to the given state.

---

```jsx
function useRecoilState<T>(state: RecoilState<T>): [T, SetterOrUpdater<T>];

type SetterOrUpdater<T> = (T | (T => T)) => void;
```

- `state`: an [`atom`](/docs/api-reference/core/atom) or a _writeable_ [`selector`](/docs/api-reference/core/selector). Writeable selectors are selectors that have both a `get` and `set` in their definition while read-only selectors only have a `get`.

This API is similar to the React [`useState()`](https://reactjs.org/docs/hooks-reference.html#usestate) hook except it takes a Recoil state instead of a default value as an argument.  It returns a tuple of the current value of the state and a setter function.  The setter function may either take a new value as an argument or an updater function which receives the previous value as a parameter.

---

This is the recommended hook to use when a component intends to read and write state.

Using this hook in a React component will subscribe the component to re-render when the state is updated.  This hook may throw if the state has an error or is pending asynchronous resolution.  Please see [this guide](/docs/guides/asynchronous-data-queries).

### Example

```jsx
import {atom, selector, useRecoilState} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelsius = selector({
  key: 'tempCelsius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) => set(tempFahrenheit, (newValue * 9) / 5 + 32),
});

function TempCelsius() {
  const [tempF, setTempF] = useRecoilState(tempFahrenheit);
  const [tempC, setTempC] = useRecoilState(tempCelsius);

  const addTenCelsius = () => setTempC(tempC + 10);
  const addTenFahrenheit = () => setTempF(tempF + 10);

  return (
    <div>
      Temp (Celsius): {tempC}
      <br />
      Temp (Fahrenheit): {tempF}
      <br />
      <button onClick={addTenCelsius}>Add 10 Celsius</button>
      <br />
      <button onClick={addTenFahrenheit}>Add 10 Fahrenheit</button>
    </div>
  );
}
```
