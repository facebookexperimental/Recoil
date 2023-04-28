---
title: useRecoilTransaction_UNSTABLE(callback, deps)
sidebar_label: useRecoilTransaction()
---

안전하고 쉽고 효율적인 방법으로 다수의 atoms를 업데이트하는 데 사용할 수 있는 transaction callback을 만듭니다. 다수의 atoms를 get() 또는 set() 할 수 있는 순수 함수로 transaction에 대한 callback을 제공합니다. transaction은 Recoil state setting의 "updater" 형태와 비슷하지만, 다수의 atoms에서 동작할 수 있습니다.
동일한 transaction 내에서 쓰기는 다음 읽기에서 볼 수 있습니다.

transactions 뿐만 아니라, 이 Hook은 다음과 같은 경우에도 유용합니다:
* 다수의 atoms에 대해서 동작을 수행하기 위한 reducer 패턴을 구현합니다.
* 렌더링 시점에 어떤 atom 혹은 selector가 업데이트를 원하는지 모르는 atom 혹은 selector를 동적으로 업데이트하므로 [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState)는 사용할 수 없습니다.
* 렌더링 전에 데이터를 미리 가져옵니다. [(Pre-fetching)](/docs/guides/asynchronous-data-queries#pre-fetching)

---

```jsx
interface TransactionInterface {
  get: <T>(RecoilValue<T>) => T;
  set: <T>(RecoilState<T>,  (T => T) | T) => void;
  reset: <T>(RecoilState<T>) => void;
}

function useRecoilTransaction_UNSTABLE<Args>(
  callback: TransactionInterface => (...Args) => void,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => void
```

* **`callback`** - 트랜잭션 인터페이스를 제공하는 래퍼 함수가 있는 사용자 콜백 함수입니다. ***이 기능은 어떠한 사이드이펙트 없이 순수해야 합니다.***
* **`deps`** - 콜백의 메모이제이션을 위한 선택적 디펜던시 집합입니다.  `useCallback()`과 마찬가지로 생성된 트랜잭션 콜백은 기본적으로 메모되지 않으며 각 렌더에서 새 함수를 생성합니다.  빈 배열을 전달하여 항상 동일한 함수 인스턴스를 반환할 수 있습니다.  `deps` 배열에 값을 전달하면,  dep의 등식이 변경되면 새 함수가 사용됩니다.  T이러한 값은 콜백 본문 내에서 오래되지 않고 사용할 수 있습니다. (See [`useCallback`](https://react.dev/reference/react/useCallback)) [update eslint](/docs/introduction/installation#eslint) eslint를 업데이트하여 올바르게 사용할 수 있도록 할 수 있습니다.

Transaction Interface:
* **`get`** - 트랜잭션 이전에 수행된 모든 쓰기를 반영하여 요청된 Recoil 상태에 대한 현재 값을 가져옵니다.  이것은 현재 동기 Atom만 지원합니다.
* **`set`** - Atom 값을 설정합니다.  새 값을 직접 제공하거나 새 값을 반환하고 현재 값을 매개 변수로 사용하는 업데이트 프로그램 기능을 제공할 수 있습니다. 현재 값은 현재 트랜잭션에서 현재까지 보류 중인 다른 모든 상태 변경을 나타냅니다.
* **`reset`** - Atom 값을 기본값으로 재설정합니다.

### Transaction Example

Suppose we have two atoms, `positionState` and `headingState`, and we'd like to update them together as part of a single action, where the new value of `positionState` is a function of *both* the current value of `positionState` and `headingState`.

```jsx
const goForward = useRecoilTransaction_UNSTABLE(({get, set}) => (distance) => {
  const heading = get(headingState);
  const position = get(positionState);
  set(positionState, {
    x: position.x + cos(heading) * distance,
    y: position.y + sin(heading) * distance,
  });
});
```

Then you can execute the transaction by just calling `goForward(distance)` in an event handler.  This will update state based on the *current* values, not the state when the components rendered.

You can also read the values of previous writes during a transaction.  Because no other updates will be committed while the updater is executing, you will see a consistent store of state.

```jsx
const moveInAnL = useRecoilTransaction_UNSTABLE(({get, set}) => () => {
  // Move Forward 1
  const heading = get(headingState);
  const position = get(positionState);
  set(positionState, {
    x: position.x + cos(heading),
    y: position.y + sin(heading),
  });

  // Turn Right
  set(headingState, heading => heading + 90);

  // Move Forward 1
  const newHeading = get(headingState);
  const newPosition = get(positionState);
  set(positionState, {
    x: newPosition.x + cos(newHeading),
    y: newPosition.y + sin(newHeading),
  });
});
```

### Reducer Example

This hook is also useful for implementing reducer patterns to execute actions over multiple atoms:

```jsx
const reducer = useRecoilTransaction_UNSTABLE(({get, set}) => action => {
  switch(action.type) {
    case 'goForward':
      const heading = get(headingState);
      set(positionState, position => {
        x: position.x + cos(heading) * action.distance,
        y: position.y + sin(heading) * action.distance,
      });
      break;

    case 'turn':
      set(headingState, action.heading);
      break;
  }
});
```

### Current Limitations and Future Vision

* Transactions currently only support atoms, not yet selectors.  This support can be added in the future.
* Atoms with default values that are selectors are also not yet supported.
* Atoms that are read must have a synchronous value.  If it is in an error state or an asynchronous pending state, then the transaction will throw an error.  It would be possible to support pending dependencies by aborting the transaction if a dependency is pending and then re-starting the transaction when it is available.  This is consistent with how the selector `get()` is implemented.
* Transactions do not have a return value.  If we want to have some notification a transaction completes, or use transactions to request slow data, or to request data from event handlers, then we could have a transaction return a `Promise` to a return value.
* Transactions must be synchronous.  There is a proposal to allow asynchronous transactions.  The user could provide an `async` transaction callback function which could use `await`.  The atomic update of all sets would not be applied, however, until the `Promise` returned by the transaction is fully resolved.
* Transactions must not have any side-effects.  If you require side-effects, then use [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) instead.
