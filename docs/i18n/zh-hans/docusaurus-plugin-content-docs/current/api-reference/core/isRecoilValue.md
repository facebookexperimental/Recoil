---
title: isRecoilValue(value)
sidebar_label: isRecoilValue()
---

如果 `value` 是一个 atom 或者 selector 则返回 `true`，反之，返回 `false`。

```jsx
function isRecoilValue(value: mixed): boolean
```

---

### 示例

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
