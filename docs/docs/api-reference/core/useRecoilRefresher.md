---
title: useRecoilRefresher_UNSTABLE(state)
sidebar_label: useRecoilRefresher()
---

The `useRecoilRefresher_UNSTABLE()` hook returns a callback which can be called with a selector to clear any caches associated with it.  If a selector makes any async requests this would cause it to re-evaluate and issue a new request.  This is useful, for example, if you wish to refresh with newer data or re-try after an error.  (See [Asynchronous Data Queries Guide](/docs/guides/asynchronous-data-queries#query-refresh))

---

```jsx
type Refresher = () => void;

function useRecoilRefresher_UNSTABLE(state: RecoilValue): Refresher
```

It is currently a no-op to "refresh" an atom, it will retain its current state.  Selectors will have their caches cleared.  Because wrapper selectors are often used as abstractions, refreshing a selector will also recursively refresh the caches of all selectors that it depends on.

### Example

```jsx
const myQuery = selector({
  key: 'MyQuery',
  get: () => fetch(myQueryURL),
});

function MyComponent() {
  const data = useRecoilValue(myQuery);
  const refresh = useRecoilRefresher_UNSTABLE(myQuery);

  return (
    <div>
      Data: {data}
      <button onClick={() => refresh()}>Refresh</button>
    </div>
  );
}
```
