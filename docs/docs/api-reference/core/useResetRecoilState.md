---
title: useResetRecoilState(state)
sidebar_label: useResetRecoilState()
---

Returns a function that will reset the value of the given state to its default value.

Using `useResetRecoilState()` allows a component to reset the state to its default value without subscribing the component to re-render whenever the state changes.

---

```jsx
function useResetRecoilState<T>(state: RecoilState<T>): () => void;
```

- `state`: a writable Recoil state

### Example

```jsx
import {todoListState} from "../atoms/todoListState";

const TodoResetButton = () => {
  const resetList = useResetRecoilState(todoListState);
  return <button onClick={resetList}>Reset</button>;
};
```
