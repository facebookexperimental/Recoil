---
title: Dev Tools
sidebar_label: Dev Tools
---

Recoil has functionality to allow you to observe and update state changes.

----
## *IMPORTANT NOTE*
***This API is currently under development and will change.  Please stay tuned...***

----

## Observing All State Changes

You can use a hook such as [**`useRecoilSnapshot()`**](/docs/api-reference/core/useRecoilSnapshot) or [**`useRecoilTransactionObserver_UNSTABLE()`**](/docs/api-reference/core/useRecoilTransactionObserver) to subscribe to state changes and obtain a [**`Snapshot`**](/docs/api-reference/core/Snapshot) of the new state.

Once you have a `Snapshot`, you can use methods such as **`getLoadable()`**, **`getPromise()`**, and **`getInfo_UNSTABLE()`** to inspect the state and use **`getNodes_UNSTABLE()`** to iterate over the set of known atoms.

```jsx
function DebugObserver(): React.Node {
  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    console.debug('The following atoms were modified:');
    for (const node of snapshot.getNodes_UNSTABLE({isModified: true})) {
      console.debug(node.key, snapshot.getLoadable(node));
    }
  }, [snapshot]);

  return null;
}
```

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <DebugObserver />
      ...
    </RecoilRoot>
  );
}
```

## Observing State Changes On-Demand

Or, you can use the [**`useRecoilCallback()`**](/docs/api-reference/core/useRecoilCallback) hook to obtain a [**`Snapshot`**](/docs/api-reference/core/Snapshot) on-demand.

```jsx
function DebugButton(): React.Node {
  const onClick = useRecoilCallback(({snapshot}) => async () => {
    console.debug('Atom values:');
    for (const node of snapshot.getNodes_UNSTABLE()) {
      const value = await snapshot.getPromise(node);
      console.debug(node.key, value);
    }
  }, []);

  return <button onClick={onClick}>Dump State</button>
}
```

## Time Travel

The [**`useGotoRecoilSnapshot()`**](/docs/api-reference/core/useGotoRecoilSnapshot) hook can be used to update the entire Recoil state to match the provided `Snapshot`.  This example maintains a history of state changes with the ability to go back and restore previous global state.

`Snapshot`'s also provide a **`getID()`** method.  That can be used, for example, to help determine if you are reverting to a previous known state to avoid updating your snapshot history.

```jsx
function TimeTravelObserver() {
  const [snapshots, setSnapshots] = useState([]);

  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    if (snapshots.every(s => s.getID() !== snapshot.getID())) {
      setSnapshots([...snapshots, snapshot]);
    }
  }, [snapshot]);

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
      ))}
    </ol>
  );
}
```
