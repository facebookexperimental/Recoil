---
title: atom(options)
sidebar_label: atom()
---

Retorna el estado escribile de Recoil.

---

- `options`
  - `key`: Una cadena única que se usa para identificar el átomo internamente. Esta cadena debería ser única con respecto a los otros átomos y selectores en la aplicación entera.
  - `default`: El valor inicial del átomo.

Frecuentemente usara los siguientes hooks para interactuar con los átomos::

- [`useRecoilState()`](/docs/api-reference/core/useRecoilState): utilice este hook cuando su intención sea leer y escribir a un átomo. Este hook suscribe el componente al átomo.
- [`useRecoilValue()`](/docs/api-reference/core/useRecoilValue): utilice este hook cuando su intención sea unicamente leer un átomo. Este hook suscribe el componente al átomo.
- [`useSetRecoilState()`](/docs/api-reference/core/useRecoilState): utilice este hook cuando su intención sea unicamente escrbir en un átomo.

Para aquellos casos más raros donde necesite leer el valor de un átomo sin suscribirse al componente, lea [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback).

### Example

```javascript
import {atom, useRecoilState} from 'recoil';

const counter = atom({
  key: 'myCounter',
  default: 0,
});

function Counter() {
  const [count, setCount] = useRecoilState(counter);
  const incrementByOne = () => setCount(count + 1);

  return (
    <div>
      Count: {count}
      <br />
      <button onClick={incrementByOne}>Increment</button>
    </div>
  );
}
```
