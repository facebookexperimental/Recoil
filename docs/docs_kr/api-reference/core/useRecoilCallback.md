---
title: useRecoilCallback(callback, deps)
sidebar_label: useRecoilCallback()
---

이 hook은 [*`useCallback()`*](https://reactjs.org/docs/hooks-reference.html#usecallback)과 비슷합니다만 Recoil 상태(state)에서 callback이 동작하도록 API를 제공합니다. 이 hook은 비동기적으로 현재의 Recoil 상태를 업데이트하는 기술과 Recoil 상태의 읽기 전용 [`Snapshot`](/docs/api-reference/core/Snapshot) 에 접근할 수 있는 callback을 구축하기 위해 사용될 수 있습니다.

이 hook을 사용하기 위한 동기로는 다음을 포함할 수 있습니다:
* atom 혹은 selector가 업데이트 될 때 리렌더링하기 위해 React 컴포넌트를 구독하지 않고 비동기적으로 Recoil 상태를 읽기 위해 사용하기
* 렌더링 할 때에 수행하고 싶지 않은 비동기 동작에 대한 값비싼 조회를 연기할 때
* Recoil 상태에 읽거나 쓰려는 경우 부수효과가 실행시킵니다.
* 렌더링 시점에 어떤 atom 혹은 selector가 업데이트를 원하는지 모르는 atom 혹은 selector를 동적으로 업데이트하므로 [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState) 는 사용할 수 없습니다.
* 렌더링 이전에 데이터를 미리 가져옵니다.([Pre-fetching](/docs/guides/asynchronous-data-queries#pre-fetching))

---

```jsx
type CallbackInterface = {
  snapshot: Snapshot,
  gotoSnapshot: Snapshot => void,
  set: <T>(RecoilState<T>, (T => T) | T) => void,
  reset: <T>(RecoilState<T>) => void,
};

function useRecoilCallback<Args, ReturnValue>(
  callback: CallbackInterface => (...Args) => ReturnValue,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => ReturnValue
```

* **`callback`** - 콜백 인터페이스를 제공하는 래퍼 함수가 있는 유저 콜백 함수. 상태를 변경하는 콜백은 현재 Recoil 상태를 비동기로 업데이트 하기 위해 대기합니다. 래핑된 함수의 타입 시그니쳐는 리턴된 콜백의 타입 시그니쳐와 일치합니다.
* **`deps`** - 콜백을 메모하기 위한 선택적 의존성 모음입니다. `useCallback()`처럼, 생성된 콜백은 기본적으로 메모되지 않고 렌더링 할 때마다 새로운 함수를 생성합니다. 빈 배열을 넘겨 항상 동일한 함수 인스턴스를 반환하게 할 수도 있습니다. 만약 `deps` 배열에 값을 전달하고 dep의 참조 동등성이 변경되면 새로운 함수가 사용됩니다. 그러면 그 값들은 콜백의 몸체 내에서 오래되지 않게 사용될 수 있습니다. ([`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback) 을 확인해주세요) [eslint를 업데이트](/docs/introduction/installation#eslint) 하여 이것이 올바르게 사용되고 있는지 확인할 수 있습니다.

콜백 인터페이스:
* **`snapshot`** - Snapshot은 콜백이 호출 된 현재 트랜잭션이 시작될 때 React batch로 커밋된 Recoil atom 상태의 읽기 전용 보기를 제공합니다. atom 값은 정적이지만, 비동기 selector는 여전히 보류중이거나 resolve 될 수 있습니다.
* **`gotoSnapshot`** - 전역 상태를 제공된 Snapshot에 일치하도록 업데이트하는 대기열에 포함합니다.
* **`set`** - atom 혹은 selector의 값을 설정하는 대기열에 포함합니다. 다른 곳과 마찬가지로 새로운 값을 직접 제공하거나 새로운 값을 리턴하고 현재 값을 매개변수로 받는 updater 함수를 제공 할 수 있습니다. 현재의 값은 현재 트랜잭션의 날짜까지 포함한 다른 모든 대기열에 포함된 상태의 변화를 보여줍니다.
* **`reset`** - atom 혹은 selector의 값을 기본으로 초기화합니다.

### Lazy Read Example (지연하여 읽기 예제)

이 예제는 **`useRecoilCallback()`** 을 사용하여 상태가 변화 할 때 리렌더링을 위해서 컴포넌트를 구독하는 일 없이 지연하여(lazily) 상태를 읽습니다.

```jsx
import {atom, useRecoilCallback} from 'recoil';

const itemsInCart = atom({
  key: 'itemsInCart',
  default: 0,
});

function CartInfoDebug() {
  const logCartItems = useRecoilCallback(({snapshot}) => async () => {
    const numItemsInCart = await snapshot.getPromise(itemsInCart);
    console.log('Items in cart: ', numItemsInCart);
  });

  return (
    <div>
      <button onClick={logCartItems}>Log Cart Items</button>
    </div>
  );
}
```
