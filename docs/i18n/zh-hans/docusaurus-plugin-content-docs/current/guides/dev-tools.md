---
title: 开发工具
sidebar_label: 开发工具
---

Recoil 允许你观察和更新 state 的变化。

----
## *重要提示*
***此 API 目前仍在开发中，且将会有所变化。敬请期待……***

----

## 观察所有 state 变化

你可以使用一个钩子函数来订阅 state 的变化，例如 [**`useRecoilSnapshot()`**](/docs/api-reference/core/useRecoilSnapshot) 和 [**`useRecoilTransactionObserver_UNSTABLE()`**](/docs/api-reference/core/useRecoilTransactionObserver) ，同时也能得到新的 state 的 [**`Snapshot`**](/docs/api-reference/core/Snapshot)。

有 `Snapshot` 后，你即可使用一些方法来查阅 state，例如 **`getLoadable()`**，**`getPromise()`** 和 **`getInfo_UNSTABLE()`** ，同时也能使用 **`getNodes_UNSTABLE()`** 来遍历一组已知的 atom。

```jsx
function DebugObserver(): React.Node {
  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    console.debug('The following atoms were modified:');
    for (const node of snapshot.getNodes_UNSTABLE({isModified: true})) {
      console.debug(node.key, snapshot.getLoadable(node));
    }
  }, [snapshot]);

  return null;
}
```

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <DebugObserver />
      ...
    </RecoilRoot>
  );
}
```

## 按需观察 state 变化

或者，你可以使用 [**`useRecoilCallback()`**](/docs/api-reference/core/useRecoilCallback) 钩子函数按需获取 [**`Snapshot`**](/docs/api-reference/core/Snapshot)。

```jsx
function DebugButton(): React.Node {
  const onClick = useRecoilCallback(({snapshot}) => async () => {
    console.debug('Atom values:');
    for (const node of snapshot.getNodes_UNSTABLE()) {
      const value = await snapshot.getPromise(node);
      console.debug(node.key, value);
    }
  }, []);

  return <button onClick={onClick}>Dump State</button>
}
```

## 时间旅行

[**`useGotoRecoilSnapshot()`**](/docs/api-reference/core/useGotoRecoilSnapshot) 钩子函数可以用于更新整个 Recoil state，以匹配提供的 `Snapshot`。此示例展示的是维护 state 更改的历史记录以便回溯，并恢复先前的全局 state 的能力。

`Snapshot` 还提供了 **`getID()`** 方法。例如，可以使用它来帮助你确定是否正在还原到先前已知的 state，以避免更新你的快照历史记录。

```jsx
function TimeTravelObserver() {
  const [snapshots, setSnapshots] = useState([]);

  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    if (snapshots.every(s => s.getID() !== snapshot.getID())) {
      setSnapshots([...snapshots, snapshot]);
    }
  }, [snapshot]);

  const gotoSnapshot = useGotoRecoilSnapshot();

  return (
    <ol>
      {snapshots.map((snapshot, i) => (
        <li key={i}>
          Snapshot {i}
          <button onClick={() => gotoSnapshot(snapshot)}>
            Restore
          </button>
        </li>
      ))}
    </ol>
  );
}
```

## 查阅当前状态

[`useGetRecoilValueInfo_UNSTABLE()`](/docs/api-reference/core/useGetRecoilValueInfo) 提供了一个回调函数，它可用于查看当前 state 以及获取 atom 和 selector 的信息。在大多数情况下，这等效于在当前 [`Snapshot`](/docs/api-reference/core/Snapshot) 上调用 [`getInfo_UNSTABLE()`](/docs/api-reference/core/Snapshot#debug-information)，不同之处在于它能够提供一些可更改且与 Recoil state 快照无关的其他信息，例如订阅了 atom 的 React 组件集合。
