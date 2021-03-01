---
title: waitForNone(dependencies)
sidebar_label: waitForNone()
---

요청된 종속성의 현재 상태에 대한 [`Loadable`](/docs/api-reference/core/Loadable) 집합을 반환하는 동시성(concurrency) helper 입니다.

종속성들은 튜플 배열 또는 객체에 명명된 종속성으로 제공됩니다.

---

```jsx
function waitForNone(dependencies: Array<RecoilValue<>>):
  RecoilValueReadOnly<UnwrappedArrayOfLoadables>
```

```jsx
function waitForNone(dependencies: {[string]: RecoilValue<>}):
  RecoilValueReadOnly<UnwrappedObjectOfLoadables>
```
---

`waitForNone()`는 [`waitForAll()`](/docs/api-reference/utils/waitForAll)과 비슷하지만, 즉시 반환한다는 점과 값을 직접 반환하는 대신 각각 종속성에 대해 `Loadable`을 반환한다는 점이 다릅니다. [`noWait()`](/docs/api-reference/utils/noWait)과 비슷하지만, 한 번에 여러 종속성을 요청할 수 있다는 점에서 다릅니다.

이 helper는 데이터의 일부분을 사용해 작업을 하거나 다른 데이터를 사용할 수 있을 때 UI를 점진적으로 업데이트할 때 유용합니다.

### 점진적 로딩 Example

이 예제는 여러 레이어가 있는 차트를 렌더링합니다. 각 레이어는 잠재적으로 비용이 큰 데이터 쿼리가 존재합니다. 보류 상태인 각 레이어는 스피너를 사용해 즉시 렌더링하며, 해당 레이어에 대한 데이터가 들어올 때 새 레이어를 추가하도록 차트를 업데이트 합니다. 레이어 중 퀘리에 오류가 있는 경우, 해당 레이어만 오류 메세지를 표시하고 나머지 레이어는 계속 렌더링 됩니다.

```jsx
function MyChart({layerQueries}: {layerQueries: Array<RecoilValue<Layer>>}) {
  const layerLoadables = useRecoilValue(waitForNone(layerQueries));

  return (
    <Chart>
      {layerLoadables.map((layerLoadable, i) => {
        switch (layerLoadable.state) {
          case 'hasValue':
            return <Layer key={i} data={layerLoadable.contents} />;
          case 'hasError':
            return <LayerErrorBadge key={i} error={layerLoadable.contents} />;
          case 'loading':
            return <LayerWithSpinner key={i} />;
        }
      })}
    </Chart>
  );
}

```
