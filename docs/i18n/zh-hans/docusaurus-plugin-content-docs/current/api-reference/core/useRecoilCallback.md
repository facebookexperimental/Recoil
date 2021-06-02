---
title: useRecoilCallback(callback, deps)
sidebar_label: useRecoilCallback()
---

这个钩子类似于 [*`useCallback()`*](https://reactjs.org/docs/hooks-reference.html#usecallback)，但将为你的回调提供一个 API，以便与 Recoil 状态一起工作。这个钩子可以用来构造一个回调，这个回调可以访问 Recoil 状态的只读 [`Snapshot`](/docs/api-reference/core/Snapshot)，并且能够异步更新当前的 Recoil 状态。

使用这种钩子的一些情况：
* 异步读取 Recoil 状态，而无需订阅 React 组件在原子或选择器更新时重新渲染。
* 把昂贵的查询延迟到一个你不想在渲染时执行的异步操作。
* 在你想读取或写入 Recoil 状态的地方执行副作用。
* 动态更新一个原子或选择器，我们可能不知道在渲染时要更新哪个原子或选择器，所以我们不能使用 [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState)。
* [Pre-fetching](/docs/guides/asynchronous-data-queries#pre-fetching) 渲染前的数据。

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

* **`callback`** - 用户回调函数，有一个提供回调接口的包装函数。改变状态的回调将被排队，以异步更新当前的 Recoil 状态。封装函数的类型签名与返回的回调函数的类型签名相匹配。
* **`deps`** - 用于记忆回调的一组可选的依赖项。和 `useCallback()` 一样，产生的回调默认不会被备忘，每次渲染都会产生一个新的函数。你可以传递一个空数组，以始终返回相同的函数实例。如果你在 `deps` 数组中传递数值，如果任何对 dep 的引用平等性发生变化，一个新的函数将被使用。然后，这些值可以在你的回调主体中使用而不会变质。参见 [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback) 你可以 [更新 eslint](/docs/introduction/installation#eslint) 来帮助确保这一点被正确使用。

回调接口：
* **`snapshot`** - [`Snapshot`](/docs/api-reference/core/Snapshot) 提供了一个只读的 Recoil 原子状态，当回调的当前事务开始时，它与 React 批次一起提交。 虽然原子值是静态的，但异步选择器可能仍在等待或解决。
* **`gotoSnapshot`** - Enqueue 更新全局状态以匹配提供的 [`Snapshot`](/docs/api-reference/core/Snapshot)。
* **`set`** - Enqueue 设置原子或选择器的值。像其他地方一样，你可以直接提供新的值，或者提供一个返回新值并将当前值作为参数的更新器函数。当前值代表当前事务中迄今为止所有其他排队的状态变化。
* **`reset`** - 将原子或选择器的值重置为其默认值。

### 懒读取示例

这个例子使用 **`useRecoilCallback()`** 来懒读取 Recoil 状态，而不订阅组件以在状态更改时重新呈现。

```jsx
import {atom, useRecoilCallback} from 'recoil';

const itemsInCart = atom({
  key: 'itemsInCart',
  default: 0,
});

function CartInfoDebug() {
  const logCartItems = useRecoilCallback(({snapshot}) => async () => {
    const numItemsInCart = await snapshot.getPromise(itemsInCart);
    console.log('购物车中内容：', numItemsInCart);
  });

  return (
    <div>
      <button onClick={logCartItems}>记录购物车内容</button>
    </div>
  );
}
```
