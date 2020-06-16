---
title: useRecoilTransactionObserver(callback)
sidebar_label: useRecoilTransactionObserver()
---

This hook subscribes a callback to be executed every time there is a change to Recoil atom state.  Multiple updates may be batched together in a single transaction.  This hook is great for persisting state changes, dev tools, building history, &c.

```jsx
function useRecoilTransactionObserver(({
  snapshot: Snapshot,
  previousSnapshot: Snapshot,
}) => void)
```

The callback provides a [`Snapshot`](/docs/api-reference/core/Snapshot) of the current and previous state for the React batch transaction.  If you would only like to subscribe to changes for individual atoms, consider Atom Effects.  In the future, we may allow the ability to subscribe to specific conditions or provide debouncing for performance.

### Debug Example

```jsx
function DebugObserver() {
  useRecoilTransactionObserver(({snapshot}) => {
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
