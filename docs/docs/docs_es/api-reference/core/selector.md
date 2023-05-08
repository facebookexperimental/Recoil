---
title: selector(options)
sidebar_label: selector()
---

Devuelve el estado de Recoil escribible o solo lectura, según las opciones que se pasen a la función.

Los selectores representan **estado derivado** (**derived state**). Puede pensar en el estado derivado como la salida del paso de estado a una función pura que modifica el estado dado de alguna manera.

---

- `options`
  - `key`: Una cadena de caracteres única utilizada para identificar el átomo internamente. Esta cadena de caracteres debe ser única con respecto a otros átomos y selectores en toda la aplicación.
  - `get`: Una función a la que se le pasa un objeto como primer parámetro que contiene las siguientes propiedades:
    - `get`: una función utilizada para recuperar valores de otros átomos/selectores. Todos los átomos/selectores pasados a esta función se agregarán implícitamente a una lista de **dependencias** para el selector. Si alguna de las dependencias del selector cambia, el selector se volverá a evaluar.
  - `set?`: Si se establece esta propiedad, el selector devolverá el estado **escribible**. Una función a la que se le pasa un objeto como primer parámetro que contiene las siguientes propiedades:
    - `get`: una función utilizada para recuperar valores de otros átomos/selectores. Esta función no suscribirá el selector a los átomos/selectores dados.
    - `set`: una función utilizada para establecer los valores del estado de Recoil. El primer parámetro es el estado de Recoil y el segundo parámetro es el nuevo valor.

### Ejemplo (Sincrónico)

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

### Ejemplo (Asincrónico)
