---
title: useResetRecoilState(state)
---

주어진 상태를 `default` 값으로 리셋하는 함수를 반환합니다.

`useResetRecoilState()`를 사용하는 것은 컴포넌트가 상태가 변경될 때 리렌더링을 위해 컴포넌트를 구독하지 않고도 상태를 기본값으로 리셋할 수 있게 해줍니다.

---

```jsx
function useResetRecoilState<T>(state: RecoilState<T>): () => void;
```

- `state`: 쓰기 가능한 Recoil 상태

### Example

```jsx
import {todoListState} from "../atoms/todoListState";

const TodoResetButton = () => {
  const resetList = useResetRecoilState(todoListState);
  return <button onClick={resetList}>Reset</button>;
};
```
