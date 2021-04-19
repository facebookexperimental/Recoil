---
title: useRecoilTransactionObserver_UNSTABLE(callback)
sidebar_label: useRecoilTransactionObserver()
---

## ***NOTE***: *이 API는 불안정합니다.*

이 hook은 Recoil atom 상태에 변화가 생길 때마다 콜백이 실행되도록 구독합니다. 여러 업데이트를 단일 트랜젝션에서 일괄적으로 처리할 수 있습니다. 이 hook은 지속된 상태 변화, 개발 툴, 히스토리 빌드 등등에 좋습니다.

```jsx
function useRecoilTransactionObserver_UNSTABLE(({
  snapshot: Snapshot,
  previousSnapshot: Snapshot,
}) => void)
```

React 일괄 트랜젝션을 위한 현재와 이전 상태의 [`Snapshot`](/docs/api-reference/core/Snapshot) 을 제공하는 콜백입니다. 개별적인 atom에 대한 변경만 구독하고 싶다면 대신 effect를 고려해보는 것이 좋습니다. 향후에는 특정 조건에 구독하거나 성능을 위해 debouncing을 제공할 수 있는 기능을 허용할 수도 있습니다.

### Debug Example

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
