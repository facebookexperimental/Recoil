---
title: useRecoilBridgeAcrossReactRoots()
sidebar_label: useRecoilBridgeAcrossReactRoots()
---

帮助桥接 Recoil 状态与嵌套的 React root 和渲染器的钩子函数。

```jsx
function useRecoilBridgeAcrossReactRoots_UNSTABLE():
  React.AbstractComponent<{children: React.Node}>;
```
如果使用 `ReactDOM.render()` 创建了一个嵌套的 React root，或者使用了嵌套的自定义渲染器，React 则不会将上下文状态传播到 child root。当你需要 "桥接" 并与嵌套的 React root 共享 Recoil 状态，这个钩子发挥作用了。此钩子函数的返回值类型为 React 组件，你可以用此返回值来代替嵌套的 React root 中的 `<RecoilRoot>` 以共享相同且一致的 Recoil 存储状态。与任何跨 React root 的状态共享一样，在所有情况下，变化都可能不会完美同步。

### 示例

```jsx
function Bridge() {
  const RecoilBridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

  return (
    <CustomRenderer>
      <RecoilBridge>
        ...
      </RecoilBridge>
    </CustomRenderer>
  );
}

function MyApp() {
  return (
    <RecoilRoot>
      ...
      <Bridge />
    </RecoilRoot>
  );
}
```
