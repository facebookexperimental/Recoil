---
title: isRecoilValue(value)
sidebar_label: isRecoilValue()
---

Retourne `true` si `value` est soit un atome soit un sélecteur ou `false` sinon.

```jsx
function isRecoilValue(value: mixed): boolean
```

---

### Example

```jsx
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
