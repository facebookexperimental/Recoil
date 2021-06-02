---
title: errorSelector(message)
sidebar_label: errorSelector()
---

一个总是抛出已有错误的 [selector](/docs/api-reference/core/selector)。

```jsx
function errorSelector(message: string): RecoilValueReadOnly
```

### 示例

```jsx
const myAtom = atom({
  key: 'My Atom',
  default: errorSelector('Attempt to use Atom before initialization'),
});
```
