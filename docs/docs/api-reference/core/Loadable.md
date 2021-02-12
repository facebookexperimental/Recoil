---
title: class Loadable
sidebar_label: Loadable
---

A `Loadable` object represents the current state of a Recoil [atom](/docs/api-reference/core/atom) or [selector](/docs/api-reference/core/selector).  This state may either have a value available, may be in an error state, or may still be pending asynchronous resolution.  A `Loadable` has the following interface:

- `state`: The current state of the atom or selector.  Possible values are `'hasValue'`, `'hasError'`, or `'loading'`.
- `contents`: The value represented by this `Loadable`.  If the state is `hasValue`, it is the actual value, if the state is `hasError` it is the `Error` object that was thrown, and if the state is `loading`, then you can use `toPromise()` to get a `Promise` of the value.

Loadables also contain helper methods for accessing the current state.  *Consider this API to be unstable*:

- `getValue()` - Method to access the value that matches the semantics of React Suspense and Recoil selectors.  If the state has a value then it returns a value, if it has an error then it throws that error, and if it is still pending then it suspends execution or rendering to propagate the pending state.
- `toPromise()`: returns a `Promise` that will resolve when the selector has resolved. If the selector is synchronous or has already resolved, it returns a `Promise` that resolves immediately.
- `valueMaybe()` - Returns the value if available, otherwise returns `undefined`
- `valueOrThrow()` - Returns the value if available or throws an Error.
- `map()` - Takes a function to transform the value of the Loadable and returns a new Loadable with the transformed value.  The transformation function gets a parameter of the value and returns the new value; it can also propagate thrown errors or suspense.

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
```
