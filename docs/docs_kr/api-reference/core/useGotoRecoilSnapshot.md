---
title: useGotoRecoilSnapshot(snapshot)
sidebar_label: useGotoRecoilSnapshot()
---

이 hook은 [`Snapshot`](/docs/api-reference/core/Snapshot) 을 매개변수로 받고 이 atom 상태에 일치하게 현재 [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) 상태를 업데이트하는 콜백을 리턴합니다. 

```jsx
function useGotoRecoilSnapshot(): Snapshot => void
```

### Transaction Example

**Important Note**: 이 예제는 *모든* 상태 변화에 리렌더링을 하기 위해 컴포넌트를 구독하므로 효율적이지 않습니다.

```jsx
function TransactionButton(): React.Node {
  const snapshot = useRecoilSnapshot(); // Subscribe to all state changes
  const modifiedSnapshot = snapshot.map(({set}) => {
    set(atomA, x => x + 1);
    set(atomB, x => x * 2);
  });
  const gotoSnapshot = useGotoRecoilSnapshot();
  return <button onClick={() => gotoSnapshot(modifiedSnapshot)}>Perform Transaction</button>;
}
```

### Time Travel Example

[Time Travel 예제](/docs/guides/dev-tools#time-travel)를 확인해주세요.
