---
title: useRecoilValue(state)
sidebar_label: useRecoilValue()
---

주어진 Recoil 상태의 값을 리턴합니다.

이 hook은 암묵적으로 주어진 상태에 컴포넌트를 구독합니다.

---

```jsx
function useRecoilValue<T>(state: RecoilValue<T>): T;
```

- `state`: [`atom`](/docs/api-reference/core/atom) 혹은  [`selector`](/docs/api-reference/core/selector)

---

이 hook는 **읽기 전용 상태**와 **쓰기 가능 상태**에서 모두 동작하므로 컴포넌트가 상태를 읽을 수만 있게 하고 싶을 때에 추천하는 hook입니다. selector가 읽기 전용이거나 쓰기 가능한 상태일 때, Atom은 쓰기 가능한 상태입니다. 더 많은 정보를 원하신다면  [`selector()`](/docs/api-reference/core/selector) 를 참고하세요.

이 hook을 React 컴포넌트에서 사용하면 상태가 업데이트 될 때 리렌더링을 하도록 컴포넌트를 구독합니다. 이 hook은 상태가 error를 가지고 있거나 보류중인 비동기 resolution이 있다면 이를 던져 줄 수 있습니다. 다음의 [가이드](/docs/guides/asynchronous-data-queries)를 참고해주십시오.

### Example

```jsx
import {atom, selector, useRecoilValue} from 'recoil';

const namesState = atom({
  key: 'namesState',
  default: ['', 'Ella', 'Chris', '', 'Paul'],
});

const filteredNamesState = selector({
  key: 'filteredNamesState',
  get: ({get}) => get(namesState).filter((str) => str !== ''),
});

function NameDisplay() {
  const names = useRecoilValue(namesState);
  const filteredNames = useRecoilValue(filteredNamesState);

  return (
    <>
      Original names: {names.join(',')}
      <br />
      Filtered names: {filteredNames.join(',')}
    </>
  );
}
```
