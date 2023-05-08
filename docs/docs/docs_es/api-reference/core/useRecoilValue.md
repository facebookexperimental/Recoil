---
title: useRecoilValue()
sidebar_label: useRecoilValue()
---

Retorna el estado dado de Recoil.

Este hook se suscribe de manera implícita el componente al estado dado.

---

- `estado`: [`átomo`](/docs/api-reference/core/atom) o [`selector`](/docs/api-reference/core/selector)

Este es el hook que se recomienda usar cuando el componente intenta de leer el estado sin escribir porque este hook funciona con ambos el **estado de solo-lectura** y el **estado escribible**. Los átomos son unicamente escribibles, mientras que los selectores son escribibles o solo-lectura. Para mas informacion ver, [`selector()`](/docs/api-reference/core/selector).

### Example

```javascript
import {atom, selector, useRecoilValue} from 'recoil';

const namesState = atom({
  key: 'namesState',
  default: ['', 'Ella', 'Chris', '', 'Paul'],
});

const filteredNamesState = selector({
  key: 'filteredNamesState',
  get: ({get}) => get(namesState).filter((str) => str !== ''),
});

function NameDisplay() {
  const names = useRecoilValue(namesState);
  const filteredNames = useRecoilValue(filteredNamesState);

  return (
    <>
      Original names: {names.join(',')}
      <br />
      Filtered names: {filteredNames.join(',')}
    </>
  );
}
```
