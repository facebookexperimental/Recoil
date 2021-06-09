---
title: useRecoilStateLoadable(state)
sidebar_label: useRecoilStateLoadable()
---

此钩子可用于读取异步 selector 的值。为获取到指定状态值，此钩子将隐含地订阅对应组件。

与 [`useRecoilState()`](/docs/api-reference/core/useRecoilState) 不同，当读取异步 selector 时，这个钩子不会抛出一个 `Error` 或`Promise` (为了能与 [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html) 共存)。相反，这个钩子会返回一个 [`Loadable`](/docs/api-reference/core/Loadable) 对象的值以及 setter 回调。

---

```jsx
function useRecoilStateLoadable<T>(state: RecoilState<T>): [Loadable<T>, (T | (T => T)) => void]
```
- `state`: 一个可写的 [`atom`](/docs/api-reference/core/atom) 或 _可能_ 有一些异步操作的 [`selector`](/docs/api-reference/core/selector)。返回的 loadable 的状态将取决于所提供的状态 selector 的状态。

返回一个 [`Loadable`](/docs/api-reference/core/Loadable) 的当前状态与接口：

- `state`: 表示 selector 的状态。可能的值是 `hasValue`、`hasError`、`loading`。
- `contents`: `Loadable` 所代表的值。如果状态是 `hasValue`，它就是实际的值；如果状态是 `hasError`，它就是被抛出的 `Error` 对象，如果状态是 `loading`，那么它就是 `Promise`。

---

### 示例

```jsx
function UserInfo({userID}) {
  const [userNameLoadable, setUserName] = useRecoilStateLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
