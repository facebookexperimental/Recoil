---
title: 개발 도구
sidebar_label: 개발 도구
---

Recoil은 상태의 변경을 관찰하고 업데이트 할 수 있도록 기능을 제공합니다.

---

## _IMPORTANT NOTE_

**_이 API는 현재 개발중이며 바뀔 수 있습니다. 지속적인 관심 바랍니다..._**

---

## Observing All State Changes (모든 상태의 변화 관찰)

[**`useRecoilSnapshot()`**](/docs/api-reference/core/useRecoilSnapshot) 과 같은 hook을 사용하거나 [**`useRecoilTransactionObserver_UNSTABLE()`**](/docs/api-reference/core/useRecoilTransactionObserver) 을 사용하여 상태의 변화를 구독하고 새로운 상태의 [**`Snapshot`**](https://recoiljs.org/docs/api-reference/core/Snapshot) 을 얻을 수 있습니다.

한번 Snapshot을 얻으면 **`getLodable()`**, **`getPromise()`** , 그리고 **`getInfo_UNSTABLE()`** 과 같은 메서드를 사용하여 상태를 감시할 수 있으며, **`getNodes_UNSTABLE()`** 을 사용하여 알려진 atom의 set를 순회 할 수도 있습니다.

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

## Observing State Changes On-Demand (On-Demand 방식에 따라 상태 변화 관찰하기)

혹은 [**`useRecoilCallback()`**](https://recoiljs.org/docs/api-reference/core/useRecoilCallback) hook을 사용하여 필요에 따라 [**`Snapshot`**](https://recoiljs.org/docs/api-reference/core/Snapshot) 을 얻을 수도 있습니다.

```jsx
function DebugButton(): React.Node {
  const onClick = useRecoilCallback(
    ({snapshot}) => async () => {
      console.debug('Atom values:');
      for (const node of snapshot.getNodes_UNSTABLE()) {
        const value = await snapshot.getPromise(node);
        console.debug(node.key, value);
      }
    },
    [],
  );

  return <button onClick={onClick}>Dump State</button>;
}
```

## Time Travel

[**`useGotoRecoilSnapshot()`**](/docs/api-reference/core/useGotoRecoilSnapshot) hook을 사용하여 제공된 `Snapshot`과 매치되도록 전체 Recoil 상태를 업데이트 할 수 있습니다. 이 예제는 이전의 전역 상태로 돌아가 복구하는 능력을 이용해 상태 변경 히스토리를 유지합니다

Snapshot은 **`getID()`** 메서드도 제공합니다. **`getID()`** 는 `snapshot` 히스토리의 업데이트를 막기 위해 이전에 알려진 상태로 되돌아가는지 알아내는데에 도움을 줍니다.

```jsx
function TimeTravelObserver() {
  const [snapshots, setSnapshots] = useState([]);

  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    if (snapshots.every((s) => s.getID() !== snapshot.getID())) {
      setSnapshots([...snapshots, snapshot]);
    }
  }, [snapshot]);

  const gotoSnapshot = useGotoRecoilSnapshot();

  return (
    <ol>
      {snapshots.map((snapshot, i) => (
        <li key={i}>
          Snapshot {i}
          <button onClick={() => gotoSnapshot(snapshot)}>Restore</button>
        </li>
      ))}
    </ol>
  );
}
```
## Inspecting current state (현재 상태 검사)

[`useGetRecoilValueInfo_UNSTABLE()`](/docs/api-reference/core/useGetRecoilValueInfo)는 현재 상태를 엿보고 atom 및 Selector에 대한 정보를 얻는 데 사용할 수 있는 콜백을 제공합니다. 대부분의 경우 이것은 현재 [`Snapshot`](/docs/api-reference/core/Snapshot)에서 [`getInfo_UNSTABLE()`](/docs/api-reference/core/Snapshot#debug-information)을 호출하는 것과 같습니다. 단, Atom를 구독하는 React 컴포넌트 세트와 같은 추가 정보를 제공할 수 있는 점을 제외하고 이는 변경될 수 있으며 Recoil 상태의 스냅샷과 연결되지 않습니다.
