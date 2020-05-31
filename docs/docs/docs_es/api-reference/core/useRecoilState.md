---
título: useRecoilState()
sidebar_label: useRecoilState()
---

Devuelve una tupla donde el primer elemento es el valor del estado y el segundo elemento es una función de establecimiento que actualizará el valor del estado dado cuando se llame.

Este hook suscribirá implícitamente el componente al estado dado.

---

- `state`: un [`átomo`](/docs/api-reference/core/atom) o un [`selector`](/docs/api-reference/core/selector) _escribible_. Los selectores escribible son selectores que tenían tanto un `get` como un `set` en su definición, mientras que los selectores de solo lectura solo tienen un `get`.

Este es el hook recomendado para usar cuando un componente intenta leer y escribir estado. 

### Ejemplo

```javascript
import {atom, selector, useRecoilState} from 'recoil';

const tempFahrenheit = atom({
  key: 'tempFahrenheit',
  default: 32,
});

const tempCelcius = selector({
  key: 'tempCelcius',
  get: ({get}) => ((get(tempFahrenheit) - 32) * 5) / 9,
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
