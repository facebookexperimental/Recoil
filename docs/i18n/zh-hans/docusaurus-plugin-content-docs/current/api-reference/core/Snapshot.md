---
title: class Snapshot
sidebar_label: Snapshot
---

`Snapshot` 对象是 Recoil [atoms](/docs/api-reference/core/atom) 状态的一个不可改变的快照。它的目的是规范用于观察、检查和管理全局 Recoil 状态的 API。对于开发工具、全局状态同步、历史导航等大部分需求，它都是很有用的。

```jsx
class Snapshot {
  // 检查快照状态的访问器
  getLoadable: <T>(RecoilValue<T>) => Loadable<T>;
  getPromise: <T>(RecoilValue<T>) => Promise<T>;

  // 用于为了 transaction 转换快照的 API
  map: (MutableSnapshot => void) => Snapshot;
  asyncMap: (MutableSnapshot => Promise<void>) => Promise<Snapshot>;

  // 开发者工具 API
  getID: () => SnapshotID;
  getNodes_UNSTABLE: ({
    isModified?: boolean,
  } | void) => Iterable<RecoilValue<mixed>>;
  getInfo_UNSTABLE: <T>(RecoilValue<T>) => {...};
}

function snapshot_UNSTABLE(initializeState?: (MutableSnapshot => void)): Snapshot
```

## 获取快照

### 钩子

Recoil 提供了以下钩子，用以根据当前状态获取快照。

- [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) - 对快照的异步访问
- [`useRecoilSnapshot()`](/docs/api-reference/core/useRecoilSnapshot) - 对快照的同步访问
- [`useRecoilTransactionObserver_UNSTABLE()`](/docs/api-reference/core/useRecoilTransactionObserver) - 订阅所有状态变化的快照

### 构建快照

你也可以使用 `snapshot_UNSTABLE()` 工厂函数来构建一个新快照，该工厂函数可接受一个可选的初始化函数。该快照可用于 [测试](/docs/guides/testing) 或在 React 上下文之外评估 selectors。

## 读取快照

对于 atom 的状态来说，快照是只读的。它们可以用来读取 atom 状态和评估 selector 的衍生状态。`getLoadable()` 方法提供了一个 [`Loadable`](/docs/api-reference/core/Loadable) 对象，其中包含该快照中 atom 或 selectors 的状态。`getPromise()` 方法可以用来等待异步 selectors 的评估值，所以你可以看到基于静态 atom 状态的值会是什么。

### 示例

```jsx
function MyComponent() {
  const logState = useRecoilCallback(({snapshot}) => () => {
    console.log("State: ", snapshot.getLoadable(myAtom).contents);

    const newSnapshot = snapshot.map(({set}) => set(myAtom, 42));
  });
}
```

## 转换快照

在有些情况下，你可能希望转换一个快照。 虽然快照是不可变的，但它们有方法将自己与一组转换映射到一个新的不可变的快照。此种映射方法接受一个回调，该回调将传递一个 MutableSnapshot，并在整个回调过程中被转换，并最终成为由映射操作返回的新快照。

```jsx
class MutableSnapshot {
  set: <T>(RecoilState<T>, T | DefaultValue | (T => T | DefaultValue)) => void;
  reset: <T>(RecoilState<T>) => void;
}
```

注意，`set()` 和 `reset()` 方法与提供给可写 selector 的 `set` 属性的回调方法有相同的签名，但它们只影响新的快照，不影响当前状态。

## 快照导航

下面这个钩子可用于将当前的 Recoil 状态导航到提供的 `Snapshot`：
- [`useGotoRecoilSnapshot()`](/docs/api-reference/core/useGotoRecoilSnapshot) —— 更新当前状态以匹配一个快照


## 开发者工具

快照提供了一些对 [构建开发者工具](/docs/guides/dev-tools) 或提升 Recoil 调试能力有用的方法。这个 API 仍在改进中，因此先被标记为 `_UNSTABLE`；我们仍在开发初始的开发工具。

### 快照 ID

每个已提交的状态或已改变的快照都有一个唯一的不透明的版本 ID，可通过 `getID()` 方法获得该 ID。这可以用来检测我们何时通过 `useGotoRecoilSnapshot()` 回滚了之前的快照。

### 枚举 atom 和 selector

`getNodes_UNSTABLE()` 方法可以被用来遍历这个快照中使用的所有 atom 和 selector。atom、selector 和族可以在任何时候被创建。不过，它们只有在被实际使用时才会出现在快照中。如果 atom 和 selector 不再被使用，它们可以被从后续的状态快照中移除。

可以指定一个可选的 `isModified` 标志，只返回自上一次处理以来被修改的 atom。

### 调试信息

`getInfo_UNSTABLE()` 方法可为 atom 和 selector 提供额外的调试信息。所提供的调试信息会不断改进，但可能包括：

* `loadable` - 一个具有当前状态的 Loadable。 与 `getLoadable()` 等方法不同，这个方法根本不会改变快照。它提供了当前的状态，但不会初始化新的 atom/selector，执行任何新的 selector 评估，或更新任何依赖关系或订阅。
* `isSet` - 如果这是一个在快照状态中存储有明确值的 atom，则为 True。 如果这是一个 selector 或使用默认的 atom 状态，则为 False。
* `isModified` - 如果这是一个自上次处理后被修改的 atom，则为 True。
* `type` - 要么是 `atom`，要么是 `selector`。
* `deps` - 这个节点所依赖的 atom 或 selector 的迭代器。
* `subscribers` - 关于这个快照的节点的订阅信息；细节正在开发中。

这类似于 [`useGetRecoilValueInfo_UNSTABLE()`](/docs/api-reference/core/useGetRecoilValueInfo) 钩子，但它提供的信息是基于 `Snapshot` 中的状态，而非当前状态。它不提供与 Recoil 状态的快照无关的信息，例如订阅 React 组件。

## 状态初始化

[`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) 组件和 `snapshot_UNSTABLE()` 工厂接受一个可选的 `initializeState` 参数，通过 `MutableSnapshot` 初始化状态。当你事先知道所有的 atom 时，这对加载持久化状态很有帮助，并且与服务器端渲染兼容，在这种情况下，状态应该与初始渲染同步设置。对于每个 atom 的初始化/持久化以及对动态 atom 的简单处理，可以参考 [atom 效果](/docs/guides/atom-effects)

```jsx
function MyApp() {
  function initializeState({set}) {
    set(myAtom, 'foo');
  }

  return (
    <RecoilRoot initializeState={initializeState}>
      ...
    </RecoilRoot>
  );
}
```
