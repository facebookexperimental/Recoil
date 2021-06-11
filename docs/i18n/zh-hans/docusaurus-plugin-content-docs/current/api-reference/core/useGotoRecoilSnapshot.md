---
title: useGotoRecoilSnapshot(snapshot)
sidebar_label: useGotoRecoilSnapshot()
---

此钩子函数返回一个以 [`Snapshot`](/docs/api-reference/core/Snapshot) 作为参数的回调函数，并且将更新当前的 [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) 状态以匹配 atom 状态。

```jsx
function useGotoRecoilSnapshot(): Snapshot => void
```

### 交易示例

**重要提示**: 此示例效率并不高，因为它将订阅该组件的**所有**状态改变以便重新渲染。

```jsx
function TransactionButton(): React.Node {
  const snapshot = useRecoilSnapshot(); // 订阅所有状态改变
  const modifiedSnapshot = snapshot.map(({set}) => {
    set(atomA, x => x + 1);
    set(atomB, x => x * 2);
  });
  const gotoSnapshot = useGotoRecoilSnapshot();
  return <button onClick={() => gotoSnapshot(modifiedSnapshot)}>执行交易</button>;
}
```

### 时间旅行示例

请查看 [时间旅行示例](/docs/guides/dev-tools#time-travel)
