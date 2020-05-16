---
title: useRecoilValueLoadable()
sidebar_label: useRecoilValueLoadable()
---

Returns a `Loadable`.

This hook is intended to be used for reading the value of asynchronous selectors. This hook will implicitly subscribe the component to the given state.

Unlike `useRecoilValue()`, this hook will not throw a `Promise` when reading from a pending asynchronous selector (for the purpose of working alongside Suspense). Instead, this hook returns a `Loadable`, which is an object with the following interface:

- `state`: indicates the status of the selector. Possible values are `'hasValue'`, `'hasError'`, `'loading'`.
- `getValue()`: if there is an error, this function throws the error. If selector is still loading, it throws a Promise. Otherwise it returns the value that the selector resolved to.
- `toPromise()`: returns a `Promise` that will resolve when the selector has resolved. If the selector is synchronous or has already resolved, it returns a `Promise` that resolves immediately.

---

- `state`: a [`selector`](/docs/api-reference/core/selector) that _may_ have some asynchronous operations. The status of the returned loadable will depend on the status of the given selector.

### Example

```jsx
```
