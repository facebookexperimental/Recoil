---
title: useRecoilStateLoadable(state)
sidebar_label: useRecoilStateLoadable()
---

This hook is intended to be used for reading the value of asynchronous selectors. This hook will implicitly subscribe the component to the given state.

Unlike [`useRecoilState()`](/docs/api-reference/core/useRecoilState), this hook will not throw an `Error` or `Promise` when reading from an asynchronous selector (for the purpose of working alongside [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html)). Instead, this hook returns a [`Loadable`](/docs/api-reference/core/Loadable) object for the value along with the setter callback.

---

```jsx
function useRecoilStateLoadable<T>(state: RecoilState<T>): [Loadable<T>, (T | (T => T)) => void]
```
- `state`: a writable [`atom`](/docs/api-reference/core/atom) or [`selector`](/docs/api-reference/core/selector) that _may_ have some asynchronous operations. The status of the returned loadable will depend on the status of the provided state selector.

Returns a [`Loadable`](/docs/api-reference/core/Loadable) for the current state with the interface:

- `state`: indicates the status of the selector. Possible values are `'hasValue'`, `'hasError'`, `'loading'`.
- `contents`: The value represented by this `Loadable`.  If the state is `hasValue`, it is the actual value, if the state is `hasError` it is the `Error` object that was thrown, and if the state is `loading`, then it is a `Promise` of the value.

---

### Example

```jsx
function UserInfo({userID}) {
  const [userNameLoadable, setUserName] = useRecoilStateLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
