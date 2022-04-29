---
title: class Loadable
sidebar_label: Loadable
---

A `Loadable` object represents the current state of a Recoil [atom](/docs/api-reference/core/atom) or [selector](/docs/api-reference/core/selector).  This state may either have a value available, may be in an error state, or may still be pending asynchronous resolution.  A `Loadable` has the following interface:

- `state`: The current state of the atom or selector.  Possible values are `'hasValue'`, `'hasError'`, or `'loading'`.
- `contents`: The value represented by this `Loadable`.  If the state is `hasValue`, it is the actual value, if the state is `hasError` it is the `Error` object that was thrown, and if the state is `loading`, then a `Promise` of the value.

Loadables also contain helper methods for accessing the current state.  *Consider this API to be unstable*:

- `getValue()` - Method to access the value that matches the semantics of React Suspense and Recoil selectors.  If the state has a value then it returns a value, if it has an error then it throws that error, and if it is still pending then it suspends execution or rendering to propagate the pending state.
- `toPromise()`: returns a `Promise` that will resolve when the selector has resolved. If the selector is synchronous or has already resolved it returns a `Promise` that resolves immediately.
- `valueMaybe()` - Returns the value if available, otherwise returns `undefined`
- `valueOrThrow()` - Returns the value if available or throws an Error.
- `map(callback)` - Takes a function to transform the value of the Loadable and returns a new `Loadable` with the transformed value.  The transformation function gets a parameter of the parent Loadable's value and you can return the new value for the new Loadable; it also propagates thrown errors or suspense.  Your callback function can return either a new value, a `Promise` or `Loadable` of a new value, or it can throw an error.  This method is comparable to `.then()` for Promises.

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

## Creating Loadables

The `RecoilLoadable` interface can be imported to create your own `Loadable` objects.

```jsx
interface RecoilLoadable {
  function of<T>(T | Promise<T>, Loadable<T>): Loadable<T>;
  function error<T>(mixed): Loadable<T>;
  function all(Array<mixed | Loadable<mixed> | Promise<mixed>>): Loadable<Array<mixed>>;
  function all({[string]: mixed | Loadable<mixed> | Promise<mixed>}): Loadable<{[string]: mixed}>;
  function loading(): Loadable<empty>;
  function isLoadable(mixed): boolean;
}
```

### Examples

```jsx
RecoilLoadable.of(123);

RecoilLoadable.error(new Error('ERROR'));

RecoilLoadable.all([
  RecoilLoadable.of(1),
  RecoilLoadable.of(10),
  RecoilLoadable.of(100),
]).map(([a, b, c]) => a+b+c);
```

Loadables may represent asynchronous values:

```jsx
// Asynchronously resolves to 123
RecoilLoadable.of(Promise.resolve(123));
```

Similar to `Promise.resolve()`, `RecoilLoadable.of()` can accept literal values as well as Loadables or Promises, which will be unpacked:

```jsx
// All resolve to 'x'
RecoilLoadable.of('x');
RecoilLoadable.of(RecoilLoadable.of('x'));
RecoilLoadable.of(Promise.resolve('x'));
```

Likewise, similar to `Promise.all()`, `RecoilLoadable.all()` can accept arrays of Loadables, Promises, or literal values:

```jsx
// Resolves to [1, 2, 3]
RecoilLoadable.all([1, RecoilLoadable.of(2), Promise.resolve(3)]);

// Resolves to {value: 1, loadable: 2, promise: 3}
RecoilLoadable.all({
  value: 1,
  loadable: RecoilLoadable.of(2),
  promise: Promise.resolve(3),
});

// Never resolves
RecoilLoadable.loading();
```
