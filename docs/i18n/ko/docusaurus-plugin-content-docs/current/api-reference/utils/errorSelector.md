---
title: errorSelector(message)
sidebar_label: errorSelector()
---

항상 제공된 에러를 발생시키는 [selector](/docs/api-reference/core/selector)입니다.

```jsx
function errorSelector(message: string): RecoilValueReadOnly
```

### Example

```jsx
const myAtom = atom({
  key: 'My Atom',
  default: errorSelector('Attempt to use Atom before initialization'),
});
```
