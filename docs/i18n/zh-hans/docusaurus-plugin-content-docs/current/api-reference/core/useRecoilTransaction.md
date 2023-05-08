---
title: useRecoilTransaction_UNSTABLE(callback, deps)
sidebar_label: useRecoilTransaction()
---

创建一个事务回调 (Transaction callback)，可用于以安全、简单和高效的方式原子更新多个Atom。为事务提供一个纯函数回调，该回调可以使用 get() 或 set() 多个Atom。事务类似于设置 Recoil 状态的 "更新器(updater)" 形式，但可以在多个Atom上操作。在同一个事物内，写入对后续读取是可见的。

除了Transaction之外，该hook还可用于以下用途：
* 实现使用reducer模式对多个Atom执行操作。
* 动态更新一个Atom，在渲染时可能不知道要更新哪个Atom或Selector，因此无法使用 [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState)。
* 在渲染前预先获取数据。[(Pre-fetching)](/docs/guides/asynchronous-data-queries#pre-fetching) 

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

* **`callback`** - 用户回调函数，使用提供事务接口的包装函数。***该函数必须是纯函数，没有任何副作用。***
* **`deps`** - 一个可选的依赖项集合，用于对回调函数进行记忆化。类似于useCallback()，默认情况下生成的事务回调函数不会被记忆化，并且每次渲染都会产生一个新的函数。您可以传递一个空数组，以始终返回相同的函数实例。如果您在deps数组中传递了值，当任何依赖项的引用相等性发生变化时，将使用一个新的函数。然后，这些值可以在回调函数的主体内使用，而不会过时。 (参见useCallback) 您可以更新 eslint以确保正确使用它。

事务接口:
* **`get`** - 获取所请求的Recoil状态的当前值，反映了事务中先前执行的任何写入操作。目前，它仅支持同步Atom。
* **`set`** - 设置一个Atom的值。您可以直接提供新值，或者提供一个更新器（Updater）函数，该函数返回新值并以当前值作为参数。当前值代表当前事务中至今为止的所有其他挂起状态更改。
* **`reset`** - 将一个Atom的值重置为其默认值.

### 事务示例

假设我们有两个Atom，positionState和headingState，我们希望作为单个操作的一部分同时更新它们，其中positionState的新值是基于positionState和headingState的当前值的函数。

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

然后，您可以通过在事件处理程序中调用goForward(distance)来执行事务。这将基于当前值而不是组件渲染时的状态来更新状态。

在事务期间，您还可以读取先前写入的值。由于在更新器执行时不会提交任何其他更新，因此您将看到一个一致的状态存储。

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

### Reducer 示例

这个hook也非常适用于实现reducer模式，以在多个Atom上执行动作：

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

### 目前的局限性和未来展望：

* 目前事务仅支持Atom，尚不支持Selector。这种支持可以在将来添加。
* 尚不支持具有Selector作为默认值的Atom。
* 被读取的Atom必须具有同步值。如果Atom处于错误状态或异步挂起状态，则事务将抛出错误。可以通过在依赖项挂起时中止事务，然后在依赖项可用时重新启动事务来支持挂起的依赖项。这与选择器`get()`的实现方式一致。
* 事务没有返回值。如果我们希望在事务完成时获得一些通知，或者使用事务请求慢速数据，或者从事件处理程序请求数据，那么可以使事务返回一个返回值的`Promise`。
* 事务必须是同步的。有一个提案允许异步事务。用户可以提供一个`async`事务回调函数，可以在其中使用`await`。然而，只有在事务返回的`Promise`完全解析之后，所有设置的Atom更新才会应用。
* 事务不能具有任何副作用。如果需要副作用，则应使用[`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback)。