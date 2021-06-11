---
title: waitForNone(dependencies)
sidebar_label: waitForNone()
---

一个并发 helper 方法，返回一组表示请求的依赖项当前状态的 [`Loadables`](/docs/api-reference/core/Loadable)。

依赖项可以作为元组数组提供，也可以作为对象中的命名依赖项提供。

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

`waitForNone()` 类似于 [`waitForAll()`](/docs/api-reference/utils/waitForAll)，只是它会立即为每个依赖项返回一个 [`Loadable`](/docs/api-reference/core/Loadable)，而不是直接返回值。它类似于 [`noWait()`](/docs/api-reference/utils/noWait)，只是它允许同时请求多个依赖项。

此 helper 方法对于处理部分数据或在不同数据可用时增量更新 UI 非常有用。

### 增量加载示例
此示例渲染了一个多层图表。每一层都存在耗时的数据查询操作。它将立即使用 spinners 为每个处于 pending 的图层渲染图表，并在该图层的数据返回时，更新图表以添加该层数据。如果任一图层的查询出现错误，那么只有该图层会显示错误消息，其余图层将继续渲染。

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
