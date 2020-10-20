---
title: useRecoilBridgeAcrossReactRoots()
sidebar_label: useRecoilBridgeAcrossReactRoots()
---

A hook to help with bridging Recoil state with a nested React root and renderer.

```jsx
function useRecoilBridgeAcrossReactRoots_UNSTABLE():
  React.AbstractComponent<{children: React.Node}>;
```
If a nested React root is created with `ReactDOM.render()`, or a nested custom renderer is used, React will not propagate context state to the child root.  This hook is useful if you would like to "bridge" and share Recoil state with a nested React root.  The hook returns a React component which you can use instead of `<RecoilRoot>` in your nested React root to share the same consistent Recoil store state. As with any state sharing across React roots, changes may not be perfectly synchronized in all cases.

### Example

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
