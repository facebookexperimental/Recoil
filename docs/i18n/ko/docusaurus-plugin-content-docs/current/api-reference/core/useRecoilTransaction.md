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

* **`callback`** - User callback function with a wrapper function that provides the transaction interface.  ***This function must be pure without any side-effects.***
* **`deps`** - An optional set of dependencies for memoizing the callback.  Like `useCallback()`, the produced transaction callback will not be memoized by default and will produce a new function with each render.  You can pass an empty array to always return the same function instance.  If you pass values in the `deps` array, a new function will be used if the reference equality of any dep changes.  Those values can then be used from within the body of your callback without getting stale.  (See [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback))  You can [update eslint](/docs/introduction/installation#eslint) to help ensure this is used correctly.

Transaction Interface:
* **`get`** - Get the current value for the requested Recoil state, reflecting any writes performed earlier in the transaction.  This currently only supports synchronous atoms.
* **`set`** - Set the value of an atom.  You may either provide the new value directly or an updater function that returns the new value and takes the current value as a parameter.  The current value represents all other pending state changes to date in the current transaction.
* **`reset`** - Reset the value of an atom to its default.

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
