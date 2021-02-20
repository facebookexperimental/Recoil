---
title: useSetRecoilState(state)
sidebar_label: useSetRecoilState()
---

쓰기 가능한 Recoil 상태의 값을 업데이트하기 위한 setter 함수를 리턴합니다.

---

```jsx
function useSetRecoilState<T>(state: RecoilState<T>): SetterOrUpdater<T>;

type SetterOrUpdater<T> = (T | (T => T)) => void;
```

- `state`: 쓰기 가능한 Recoil 상태 ( [`atom`](/docs/api-reference/core/atom) 혹은 *쓰기 가능*한  [`selector`](/docs/api-reference/core/selector) )

상태를 변경하기 위해 비동기로 사용될 수 있는 setter 함수를 리턴합니다. setter는 새로운 값이나 이전 값을 인수로 받는 updater 함수를 넘겨줍니다.

---

이 hook은 컴포넌트가 상태에 읽지 않고 쓰기만 하려고 할 때 추천합니다. 만약 컴포넌트가  setter를 가져오기 위해 [`useRecoilState()`](/docs/api-reference/core/useRecoilState) hook을 사용한다면 업데이트를 구독하고 atom 혹은 selector가 업데이트되면 리렌더링을 합니다. `useSetRecoilState()`을 사용하는 것은 컴포넌트가 값이 바뀔 때 리렌더링을 하기 위해 컴포넌트를 구독하지 않고도 값을 설정하게 해줍니다.

### Example

```jsx
import {atom, useSetRecoilState} from 'recoil';

const namesState = atom({
  key: 'namesState',
  default: ['Ella', 'Chris', 'Paul'],
});

function FormContent({setNamesState}) {
  const [name, setName] = useState('');
  
  return (
    <>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => setNamesState(names => [...names, name])}>Add Name</button>
    </>
)}

// This component will be rendered once when mounting
function Form() {
  const setNamesState = useSetRecoilState(namesState);
  
  return <FormContent setNamesState={setNamesState} />;
}
```
