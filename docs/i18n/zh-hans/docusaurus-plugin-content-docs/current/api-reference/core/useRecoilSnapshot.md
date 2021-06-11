---
title: useRecoilSnapshot()
sidebar_label: useRecoilSnapshot()
---

此钩子函数在渲染期间同步返回一个 [`Snapshot`](/docs/api-reference/core/Snapshot) 对象，并为所有 Recoil 状态更改订阅调用组件。你或许会想将此钩子函数用于调试工具，或者用于服务端渲染，因为在初始渲染期间，有需要拥有同步状态的地方。

```jsx
function useRecoilSnapshot(): Snapshot
```

请慎重使用此钩子，因为它会导致组件重新渲染 *所有* 的 Recoil 状态变化。未来，我们希望能为提升性能提供防抖能力。

### Link 示例
定义一个 `<LinkToNewView>` 组件，该组件根据当前已改变的状态渲染一个带有 `href` 的 `<a>` 。在这个示例中 `uriFromSnapshot()` 是一个用户定义的函数，它会对 URI 中的当前状态进行编码，当再次加载页面时可以还原这个状态。

```jsx
function LinkToNewView() {
  const snapshot = useRecoilSnapshot();
  const newSnapshot = snapshot.map(({set}) => set(viewState, 'New View'));
  return <a href={uriFromSnapshot(newSnapshot)}>Click Me!</a>;
}
```

这是一个简单的例子。我们即将提供一个类似这样的 helper 方法，用于在浏览器历史记录持久化库中生成链接，其更具扩展性且优化更好。例如，它将劫持点击处理程序来更新本地状态以替换浏览器历史记录。
