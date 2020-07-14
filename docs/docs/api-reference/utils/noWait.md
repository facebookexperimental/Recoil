---
title: noWait(state)
sidebar_label: noWait()
---

A selector helper that will return a [`Loadable`](/docs/api-reference/core/Loadable) for the current state of the provided [`atom`](/docs/api-reference/core/atom) or [`selector`](/docs/api-reference/core/selector).

```jsx
function noWait<T>(state: RecoilValue<T>): RecoilValueReadOnly<Loadable<T>>
```

---

This helper can be used to obtain the current state of a potentially asynchronous dependency without throwing if there is an error or the dependency is still pending.  It is similar to [`useRecoilValueLoadable()`](/docs/api-reference/core/useRecoilValueLoadable) except that it is a selector instead of a hook.  Because `noWait()` returns a selector, it can in turn be used by other Recoil selectors as well as hooks.

### Example

```jsx
const myQuery = selector({
  key: 'MyQuery',
  get: ({get}) => {
    const results = get(noWait(dbQuerySelector));

    return {
      hasValue: {data: results.contents},
      hasError: {error: results.contents},
      loading: {data: 'placeholder while loading'},
    }[results.state];
  }
})

```
