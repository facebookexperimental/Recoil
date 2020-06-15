---
title: useRecoilValueLoadable(state)
sidebar_label: useRecoilValueLoadable()
---

This hook is intended to be used for reading the value of asynchronous selectors. This hook will implicitly subscribe the component to the given state.

Unlike `useRecoilValue()`, this hook will not throw a `Promise` when reading from a pending asynchronous selector (for the purpose of working alongside Suspense). Instead, this hook returns a `Loadable`, which is an object with the following interface:

---

```jsx
function useRecoilValueLoadable<T>(state: RecoilValue<T>): Loadable<T>
```
- `state`: an [`atom`](/docs/api-reference/core/atom) or [`selector`](/docs/api-reference/core/selector) that _may_ have some asynchronous operations. The status of the returned loadable will depend on the status of the provided state selector.

Returns a `Loadable` which has the interface:

- `state`: indicates the status of the selector. Possible values are `'hasValue'`, `'hasError'`, `'loading'`.
- `contents`: The value represented by this `Loadable`.  If the state is `hasValue`, it is the actual value, if the state is `hasError` it is the `Error` object that was thrown, and if the state is `loading`, then it is a `Promise` of the value.
- `getValue()`: if there is an error, this function throws the error. If selector is still loading, it throws a Promise. Otherwise it returns the value that the selector resolved to.
- `toPromise()`: returns a `Promise` that will resolve when the selector has resolved. If the selector is synchronous or has already resolved, it returns a `Promise` that resolves immediately.

---

### Example

```jsx
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
