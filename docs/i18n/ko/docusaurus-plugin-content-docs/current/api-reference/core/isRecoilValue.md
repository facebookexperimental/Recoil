---
title: isRecoilValue(value)
sidebar_label: isRecoilValue()
---

`value`이 atom이나 selector일 경우 `true`를 반환하고 그렇지 않을 경우 `false`를 반환한다.

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
