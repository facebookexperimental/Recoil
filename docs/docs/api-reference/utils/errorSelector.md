---
title: errorSelector(message)
---

A [selector](/docs/api-reference/core/selector) which always throws the provided error

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
