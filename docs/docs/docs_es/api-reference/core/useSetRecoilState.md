---
title: useSetRecoilState()
sidebar_label: useSetRecoilState()
---

Devuelve una función setter para actualizar el valor del estado de Recoil escribible.

---

- `state`: estado de Recoil escribible (un [`átomo`](/docs/api-reference/core/atom) o un [`selector`](/docs/api-reference/core/selector) _escribible_)

Este es el Hook recomendado para usar cuando un componente intenta escribir en estado sin leerlo. Si un componente usara el hook useRecoilState() para obtener el setter, también se suscribiría a las actualizaciones y volvería a renderizar cuando se actualizara el átomo o el selector. El uso de useSetRecoilState() permite que un componente establezca el valor sin volver a renderizar cuando el valor cambia.

### Ejemplo

```javascript
import {atom, useSetRecoilState} from 'recoil';

const namesState = atom({
  key: 'namesState',
  default: ['Ella', 'Chris', 'Paul'],
});

function NameInput() {
  const [name, setName] = useState('');
  const setNamesState = useSetRecoilState(namesState);

  const addName = () => {
    setNamesState(existingNames => [...existingNames, name]);
  };

  const onChange = (e) => {
    setName(e.target.value);
  };

  return (
    <>
      <input type="text" value={name} onChange={onChange} />
      <button onClick={addName}>Add Name</button>
    </>
  );
}
```
