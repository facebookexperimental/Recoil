---
título: isRecoilValue(value)
sidebar_label: isRecoilValue()
---

Devuelve `true` si `value` es un átomo o un selector y `false` de lo contrario.

---

### Ejemplo

```javascript
import {atom, isRecoilValue} from 'recoil';

const counter = atom({
  key: 'myCounter',
  default: 0,
});

const strCounter = selector({
  key: 'myCounterStr',
  get: ({get}) => String(get(counter)),
});

isRecoilValue(counter); // true
isRecoilValue(strCounter); // true

isRecoilValue(5); // false
isRecoilValue({}); // false
```
