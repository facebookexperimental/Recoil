---
title: useResetRecoilState(state)
sidebar_label: useResetRecoilState()
---

返回一个函数，用来把给定 state 重置为其初始值。

使用 `useResetRecoilState()` 可将组件的 state 重置为默认值，无需订阅组件，并且每当 state 改变时会重新渲染该组件。

---

```jsx
function useResetRecoilState<T>(state: RecoilState<T>): () => void;
```

- `state`：一个可写的 Recoil state

### 示例

```jsx
import {todoListState} from "../atoms/todoListState";

const TodoResetButton = () => {
  const resetList = useResetRecoilState(todoListState);
  return <button onClick={resetList}>Reset</button>;
};
```
