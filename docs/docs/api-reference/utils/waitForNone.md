---
title: waitForNone(dependencies)
sidebar_label: waitForNone()
---

A concurrency helper that returns a set of [`Loadables`](/docs/api-reference/core/Loadable) for the current state of the requested dependencies.

The dependencies may either be provided as a tuple array or as named dependencies in an object.

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

`waitForNone()` is similar to [`waitForAll()`](/docs/api-reference/utils/waitForAll), except that it returns immediatly and returns a [`Loadable`](/docs/api-reference/core/Loadable) for each dependency instead of the values directly.  It is similar to [`noWait()`](/docs/api-reference/utils/noWait), except that it allows requesting multiple dependencies at once.

This helper is useful for working with partial data or incrementally updating the UI as different data becomes available.

### Incremental Loading Example
This example renders a chart with multiple layers.  Each layer has a potentially expensive data query.  It will render the chart immediatly using spinners for each layer that is still pending and will update the chart to add each new layer as the data for that layer comes in.  If any of the layers has an error with the query then only that layer will show an error message and the rest will continue to render.

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
