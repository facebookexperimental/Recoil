---
title: useGetRecoilValueInfo_UNSTABLE()
sidebar_label: useGetRecoilValueInfo()
---

此钩子函数允许组件 “窥视” atom 或者 selector 的当前状态、值和其他信息。这类似于 [`Snapshot`](docs/api-reference/core/Snapshot) 中的 [`getInfo_UNSTABLE()`](/docs/api-reference/core/Snapshot#debug-information) 方法。


```jsx
function useGetRecoilValueInfo_UNSTABLE(): RecoilValue<T> => AtomInfo<T>;

interface AtomInfo<T> {
  loadable?: Loadable<T>;
  isActive: boolean;
  isSet: boolean;
  isModified: boolean; // TODO 是否报告已修改的 selectors
  type: 'atom' | 'selector' | undefined; // 初始化之前暂时设定为 undefined
  deps: Iterable<RecoilValue<T>>;
  subscribers: {
    nodes: Iterable<RecoilValue<T>>,
    components: Iterable<ComponentInfo>,
  };
}

interface ComponentInfo {
  name: string;
}
```

它提供了一个可以通过 `RecoilValue<T>` 传递的函数并且将会返回一个包含 atom/selector 当前信息的对象。它并不会导致任何 state 改变或者创建任何订阅。它主要用于调试或开发工具中。

调试信息正在改进中，但可能包括：
* `loadable` - 一个带有当前状态的 Loadable。与 `getLoadable()` 等方法不同，此方法根本不会改变快照 (snapshot)。它提供当前状态，并且将不会初始化新的 atoms/selectors，执行任何新的 selector 计算，或更新任何依赖项或订阅。
* `isSet` - 如果这是存储在快照状态中的带有显式值的 atom，则为 True。如果这是一个 selector 或使用默认的 atom 状态，则为 False。
* `isModified` - 如果这是自上次处理后修改过的 atom，则为 True。
* `type` - `atom` 或者 `selector`。
* `deps` - 该节点所依赖的 atoms 或者 selectors 上的迭代器。
* `subscribers` - 有关为此快照订阅此节点的信息。详细信息正在开发中。

### 示例

```jsx
function ButtonToShowCurrentSubscriptions() {
  const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
  function onClick() {
    const {subscribers} = getRecoilValueInfo(myAtom);
    console.debug(
      'Current Subscriber Nodes:',
      Array.from(subscribers.nodes).map(({key})=>key),
    );
  }

  return <button onClick={onClick} >See Current Subscribers</button>;
}
```
