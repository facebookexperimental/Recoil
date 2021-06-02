---
title: useRecoilTransactionObserver_UNSTABLE(callback)
sidebar_label: useRecoilTransactionObserver()
---

## ***提示***: **请注意此 API 目前尚处于不稳定状态**

此钩子订阅每次更改 Recoil atom 状态时执行的回调函数。多个更新可以在一个事务中批处理。此钩子对于持久化状态更改、开发工具、构建历史等非常有用。

```jsx
function useRecoilTransactionObserver_UNSTABLE(({
  snapshot: Snapshot,
  previousSnapshot: Snapshot,
}) => void)
```

此回调函数为 React 批处理事务提供当前和先前状态的 [`Snapshot`](/docs/api-reference/core/Snapshot)。如果你只想订阅单个 atom 的更改，请考虑使用 effects 代替。将来，我们可能会允许在特定条件下订阅，或者为了提升性能提供防抖功能。

### 调试示例

```jsx
function DebugObserver() {
  useRecoilTransactionObserver_UNSTABLE(({snapshot}) => {
    window.myDebugState = {
      a: snapshot.getLoadable(atomA).contents,
      b: snapshot.getLoadable(atomB).contents,
    };
  });
  return null;
}

function MyApp() {
  return (
    <RecoilRoot>
      <DebugObserver />
      ...
    </RecoilRoot>
  );
}
```
