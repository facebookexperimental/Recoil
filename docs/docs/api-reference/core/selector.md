---
title: selector(options)
sidebar_label: selector()
---

Returns writeable or read-only Recoil state, depending on the options passed to the function.

Selectors represent **derived state**. You can think of derived state as the output of passing state to a pure function that modifies the given state in some way.

---

- `options`
  - `key`: A unique string used to identify the atom internally. This string should be unique with respect to other atoms and selectors in the entire application.
  - `get`: A function that is passed an object as the first parameter containing the following properties:
    - `get`: a function used to retrieve values from other atoms/selectors. All atoms/selectors passed to this function will be implicitly added to a list of **dependencies** for the selector. If any of the selector's dependencies change, the selector will re-evaluate.
  - `set?`: If this property is set, the selector will return **writeable** state. A function that is passed an object as the first parameter containing the following properties:
    - `get`: a function used to retrieve values from other atoms/selectors. This function will not subscribe the selector to the given atoms/selectors.
    - `set`: a function used to set the values of Recoil state. The first parameter is the Recoil state and the second parameter is the new value.

### Example (Synchronous)

```javascript
import {atom, selector, useRecoilState} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelcius = selector({
  key: 'tempCelcius',
  get: ({get}) => ((get(temptempFahrenheit) - 32) * 5) / 9,
  set: ({set}, newValue) => set(tempFahrenheit, (newValue * 9) / 5 + 32),
});

function TempCelcius() {
  const [tempF, setTempF] = useRecoilState(tempFahrenheit);
  const [tempC, setTempC] = useRecoilState(tempCelcius);

  const addTenCelcius = () => setTempC(tempC + 10);
  const addTenFahrenheit = () => setTempF(tempF + 10);

  return (
    <div>
      Temp (Celcius): {tempC}
      <br />
      Temp (Fahrenheit): {tempF}
      <br />
      <button onClick={addTenCelcius}>Add 10 Celcius</button>
      <br />
      <button onClick={addTenFahrenheit}>Add 10 Fahrenheit</button>
    </div>
  );
}
```

### Example (Asynchronous)
