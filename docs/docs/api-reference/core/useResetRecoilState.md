---
title: useResetRecoilState(state)
---

Returns a function that will reset the value of the given state to its default value.

---

```jsx
function useResetRecoilState<T>(state: RecoilState<T>): () => void;
```

- `state`: a writeable Recoil state

### Example

```jsx
import {todoListState} from "../atoms/todoListState";

const TodoResetButton = () => {
  const resetList = useResetRecoilState(todoListState);
  return <button onClick={resetList}>Reset</button>;
};
```
