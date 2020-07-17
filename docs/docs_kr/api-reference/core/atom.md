---
title: atom(options)
sidebar_label: atom()
---

*atom*은 Recoil의 상태를 표현한다. `atom()` 함수는 쓰기 가능한 `RecoilState` 객체를 반환한다.

---

```jsx
function atom<T>({
  key: string,
  default: T | Promise<T> | RecoilValue<T>,

  dangerouslyAllowMutability?: boolean,
}): RecoilState<T>
```

- `key` - 내부적으로 atom을 식별하는데 사용되는 고유한 문자열. 이 문자열은 어플리케이션 전체에서 다른 atom과 selector에 대해 고유해야 한다.
- `default` - atom의 초깃값 또는 `Promise` 또는 동일한 타입의 값을 나타내는 다른 atom이나 selector.
- `dangerouslyAllowMutability` - Recoil은 atom을 이용해 다시 렌더링 되는 컴포넌트에 언제 알려야 할지 알기 위해 atom의 상태 변화에 의존한다. 만약 atom의 값이 변경될 경우, 이를 거치지 않고 등록된 컴포넌트에 제대로 알리지 않고 상태가 변경될 수 있다. 이를 방지하기 위해 저장된 모든 값이 변경되지 않는다. 경우에 따라 이 옵션을 사용하여 이 옵션을 재정의할 수 있다.

---

atom과 상호작용하기 위해 가장 자주 사용되는 Hooks:

- [`useRecoilState()`](/docs/api-reference/core/useRecoilState): atom을 읽고 쓰려고 할 때 이 Hook을 사용한다. 이 Hook는 atom에 컴포넌트을 등록하도록 한다.
- [`useRecoilValue()`](/docs/api-reference/core/useRecoilValue): atom을 읽기만 할 때 이 Hook를 사용한다. 이 Hook는 atom에 컴포넌트를 등록하도록 한다.
- [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState): atom에 쓰려고만 할 때 이 Hook를 사용한다.
- [`useResetRecoilState()`](/docs/api-reference/core/useResetRecoilState): atom을 초깃값으로 초기화할 때 이 Hook을 사용한다.

컴포넌트가 등록되지 않고 atom의 값을 읽어야 하는 드문 경우는 [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback)를 참조하면 된다.

정적인 값으로 atom을 초기화하거나 같은 유형의 값을 나타내는 `Promise` 또는 `RecoilValue`을 사용하여 원자를 초기화할 수 있다. 왜냐하면 `Promise`가 보류 중이거나 기본 selector가 비동기일 수 있기 때문에 atom의 값도 보류 중이거나 읽을 때 오류를 발생시킬 수 있다는 것을 의미한다. 현재 atom을 설정할 때 `Promise`을 지정할 수 없다는 점에 유의해야 한다. 비동기 함수를 사용하기 위해서는 [selectors](/docs/api-reference/core/selector)를 사용한다.

atom은 `Promise`나 `RecoilValues`를 직접 저장하는 데 사용할 수 없지만 객체를 감쌀 수도 있다. `Promises`은 변경될 수 있다는 점에 유의해야 한다.

### 예시

```jsx
import {atom, useRecoilState} from 'recoil';

const counter = atom({
  key: 'myCounter',
  default: 0,
});

function Counter() {
  const [count, setCount] = useRecoilState(counter);
  const incrementByOne = () => setCount(count + 1);

  return (
    <div>
      Count: {count}
      <br />
      <button onClick={incrementByOne}>Increment</button>
    </div>
  );
}
```
