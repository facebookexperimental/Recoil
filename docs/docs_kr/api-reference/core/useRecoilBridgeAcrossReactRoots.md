---
title: useRecoilBridgeAcrossReactRoots()
sidebar_label: useRecoilBridgeAcrossReactRoots()
---

중첩된 React 루트 및 렌더러로 Recoil 상태를 연결하는데 도움이 되는 hook입니다.

```jsx
function useRecoilBridgeAcrossReactRoots_UNSTABLE():
  React.AbstractComponent<{children: React.Node}>;
```

중첩된 React 루트가 `ReactDOM.render()`로 생성되거나, 중천된 커스텀 렌더러로 사용된 경우 React는 context 상태를 자식 루트로 전파하지 않습니다. 이 hook은 중첩된 React root와 Recoil 상태를 "연결"하고 공유하는데 유용합니다. hook은 중첩된 React 루트에서 `<RecoilRoot>` 대신 사용할 수 있는 React 컴포넌트를 반환해 동일하고 일관된 Recoil 저장소 상태를 공유합니다. React 루트에서 공유되는 모든 상태와 마찬가지로 모든 경우에 완벽하게 동기화되지 않을 수 있습니다. 

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
