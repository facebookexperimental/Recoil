---
title: useResetRecoilState()
sidebar_label: useResetRecoilState()
---

Devuelve una función que restablecerá el valor del estado dado a su valor predeterminado.

---

- `state`: un estado de Recoil escribible.

### Ejemplo

```javascript
import {todoListState} from "../atoms/todoListState";

const TodoResetButton = () => {
  const resetList = useResetRecoilState(todoListState);
  return <button onClick={resetList}>Reset</button>;
};
```
