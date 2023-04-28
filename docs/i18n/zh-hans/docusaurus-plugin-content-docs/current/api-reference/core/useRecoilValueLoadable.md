---
title: useRecoilValueLoadable(state)
sidebar_label: useRecoilValueLoadable()
---

此 hook 用来读取异步 selector 的值。使用此 hook 会使组件隐式地订阅给定的 state。

与 [`useRecoilValue()`](/docs/api-reference/core/useRecoilValue) 不同，当此 hook 从异步 selector（为了和 [React Suspense](https://react.dev/reference/react/Suspense) 一起工作）读取数据时，不会抛出 `Error` 或 `Promise`，它会返回一个 [`Loadable`](/docs/api-reference/core/Loadable) 对象。

---

```jsx
function useRecoilValueLoadable<T>(state: RecoilValue<T>): Loadable<T>
```
- `state`：一个 [`atom`](/docs/api-reference/core/atom) 或一个 _可能_ 有一些异步操作的 [`selector`](/docs/api-reference/core/selector) 。给定 selector 的状态决定了返回的 loadable 的状态。

返回一个具有以下接口的 `Loadable`：

- `state`：表示 selector 的状态。可选的值有 `'hasValue'`，`'hasError'`，`'loading'`。
- `contents`：此值代表 `Loadable` 的结果。如果状态为 `hasValue`，则值为实际结果；如果状态为 `hasError`，则会抛出一个错误对象；如果状态为 `loading`，则值为 `Promise`。

---

### 示例

```jsx
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
