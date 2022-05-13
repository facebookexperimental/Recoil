---
title: useRecoilSnapshot()
sidebar_label: useRecoilSnapshot()
---

This hook synchronously returns a [`Snapshot`](/docs/api-reference/core/Snapshot) object during rendering and subscribes the calling component for all Recoil state changes.  You may want to use this hook for debug tools, or for server-side rendering where you need to synchronously have the state during the initial render.

```jsx
function useRecoilSnapshot(): Snapshot
```

Be careful using this hook because it will cause the component to re-render for *all* Recoil state changes.   Snapshots obtained from `useRecoilSnapshot()` will be retained at least for the duration that the component using them is mounted.

### Debug Example
```jsx
function DebugObserver() {
  const snapshot = useRecoilSnapshot();
  const previousSnapshot = usePrevious(snapshot);
  useEffect(() => {
    console.debug('Changed Atoms:');
    for (const node of snapshot.getNodes_UNSTABLE({isModified: true})) {
      console.debug(node.key, snapshot.getLoadable(node));
    }
  }, [snapshot]);
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

### Error Boundary Example

A [fun little example](/docs/guides/asynchronous-data-queries#retry-query-from-error-message) using snapshots in an error boundary to find, display, and retry selectors that threw an error.

### Link Example
Define a `<LinkToNewView>` component that renders an `<a>` anchor with an `href` based on the current state with a mutation applied.  In this example `uriFromSnapshot()` is some user-defined function which encodes the current state in the URI which can be restored when loading the page.

```jsx
function LinkToNewView() {
  const snapshot = useRecoilSnapshot();
  const newSnapshot = snapshot.map(({set}) => set(viewState, 'New View'));
  return <a href={uriFromSnapshot(newSnapshot)}>Click Me!</a>;
}
```

This is a simplified example.  We provide a helper like this for generating links in our browser history persistence library coming soon which is more extensible and optimized.  For example, it will hijack the click handler to update local state replacing the browser history.
