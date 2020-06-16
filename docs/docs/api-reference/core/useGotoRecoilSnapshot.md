---
title: useGotoRecoilSnapshot(snapshot)
sidebar_label: useGotoRecoilSnapshot()
---

This hook returns a callback which takes a [`Snapshot`](/docs/api-reference/core/Snapshot) as a parameter and will update the current [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) state to match this atom state.

```jsx
function useGotoRecoilSnapshot(): Snapshot => void
```

### Time Travel Example

Example list of history of state changes with the ability to go back and restore previous global state.

```jsx
function TimeTravelObserver() {
  const [snapshots, setSnapshots] = useState([]);

  useRecoilTransactionObserver(({snapshot}) => {
    setSnapshots([...snapshots, snapshot]);
  });

  const gotoSnapshot = useGotoRecoilSnapshot();

  return (
    <ol>
      {snapshots.map((snapshot, i) => (
        <li key={i}>
          Snapshot {i}
          <button onClick={() => gotoSnapshot(snapshot)}>
            Restore
          </button>
        </li>
      )}
    </ol>
  );
}
```
