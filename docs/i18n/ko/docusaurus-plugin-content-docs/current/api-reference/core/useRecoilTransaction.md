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
* **`deps`** - 콜백의 메모이제이션을 위한 선택적 디펜던시 집합입니다.  `useCallback()`과 마찬가지로 생성된 트랜잭션 콜백은 기본적으로 메모되지 않으며 각 렌더에서 새 함수를 생성합니다.  빈 배열을 전달하여 항상 동일한 함수 인스턴스를 반환할 수 있습니다.  `deps` 배열에 값을 전달하면,  dep의 등식이 변경되면 새 함수가 사용됩니다.  T이러한 값은 콜백 본문 내에서 오래되지 않고 사용할 수 있습니다. (See [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback)) [update eslint](/docs/introduction/installation#eslint) eslint를 업데이트하여 올바르게 사용할 수 있도록 할 수 있습니다.

Transaction Interface:
* **`get`** - 트랜잭션 이전에 수행된 모든 쓰기를 반영하여 요청된 Recoil 상태에 대한 현재 값을 가져옵니다.  이것은 현재 동기 Atom만 지원합니다.
* **`set`** - Atom 값을 설정합니다.  새 값을 직접 제공하거나 새 값을 반환하고 현재 값을 매개 변수로 사용하는 업데이트 프로그램 기능을 제공할 수 있습니다. 현재 값은 현재 트랜잭션에서 현재까지 보류 중인 다른 모든 상태 변경을 나타냅니다.
* **`reset`** - Atom 값을 기본값으로 재설정합니다.

### Transaction Example

`positionState`과 `headingState`라는 두 아톰(atom)이 있다 가정하고, `positionState`과 `headingState`의 현재 값을 이용해 새로운 `positionState`를 만드는 함수의 단일 동작(single action)으로 두 아톰을 *함께* 업데이트하고자 합니다. 

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

이벤트 핸들러 안 `goForward(distance)`를 호출하여 트랜잭션을 실행하면 state는 컴포넌트가 렌더링될 때의 state가 아닌 *현재*값을 기반으로 업데이트 될 것입니다. 

트랜잭션 중엔 이전에 쓴 값(previous writes)을 읽을 수도 있습니다. 업데이트가 진행될 때 다른 업데이트는 반영되지 않기 때문에 일관적인 state의 저장소가 표시됩니다.

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

아래 훅은 여러개의 아톰에 대한 동작(action)을 실행하는 리듀서(reducer) 패턴을 구현할 때 유용합니다. 

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

* 현재 트랜잭션은 atom만 지원하고 selector는 지원하지 않습니다. 미래에 추가될 예정입니다.
* 기본값이 selector인 atom또한 현재는 지원하지 않습니다.
* 읽은 atom은 반드시 동기 값을 가져야 합니다. 만약 에러 state이거나 비동기적으로 펜딩된 state이면 트랜잭션은 에러를 발생시킵니다. 디펜던시가 펜딩 중인 경우 트랜잭션을 중지하고 가능한 경우 트랜잭션을 다시 시작하여 펜딩 중인 디펜던시를 지원할 수 있습니다. selector의 `get()`의 구현 방식과 동일합니다.
* 트랜잭션은 리턴값을 가지지 않습니다. 트랜잭션 완료를 알려주는 알림을 받고싶거나 slow data를 요청하는 트랜잭션을 사용하거나, 이벤트 핸들러로부터 데이터를 요청하는 경우에 트랜잭션은 `Promise`를 반환할 수 있습니다.
* 트랜잭션은 반드시 동기적이어야 합니다. 비동기 트랜잭션을 허용하자는 제안이 있습니다. 사용자는 `await`을 사용할 수 있는 `async` 트랜잭션 콜백 함수를 제공할 수 있습니다. 하지만, 트랜잭션이 반환하는 `Promise`가 완전히 해결되기 전까지는 모든 원자 업데이트(atomic update)가 적용되지 않습니다. 
* 트랜잭션은 반드시 어떠한 side-effect도 없어야합니다. side-effect가 필요한 경우엔 [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback)을 사용할 수 있습니다.