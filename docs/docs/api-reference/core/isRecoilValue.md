---
title: isRecoilValue(value)
sidebar_label: isRecoilValue()
---

Returns `true` if `value` is either an atom or selector and `false` otherwise.

```jsx
function isRecoilValue(value: mixed): boolean
```

---

### Example

```jsx
import {atom, selector, isRecoilValue} from 'recoil';

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
