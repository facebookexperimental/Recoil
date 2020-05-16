---
title: useResetRecoilState()
---

Returns a function that will reset the value of the given state to its default value.

---

- `state`: a writeable Recoil state

### Example

```jsx
import { todoListState } from "../atoms/todoListState";

const TodoReset = () => {
  const resetList = useResetRecoilState(todoListState);
  return <button onClick={resetList}>Reset</button>;
};
```
