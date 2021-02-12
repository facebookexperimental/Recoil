---
title: useGotoRecoilSnapshot(snapshot)
sidebar_label: useGotoRecoilSnapshot()
---

This hook returns a callback which takes a [`Snapshot`](/docs/api-reference/core/Snapshot) as a parameter and will update the current [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) state to match this atom state.

```jsx
function useGotoRecoilSnapshot(): Snapshot => void
```

### Transaction Example

**Important Note**: This example is not efficient because it will subscribe the component to re-render for *all* state changes.

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

See the [Time Travel Example](/docs/guides/dev-tools#time-travel)
