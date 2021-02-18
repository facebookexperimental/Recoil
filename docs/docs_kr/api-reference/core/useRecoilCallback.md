---
title: useRecoilCallback(callback, deps)
sidebar_label: useRecoilCallback()
---

This hook is similar to [*`useCallback()`*](https://reactjs.org/docs/hooks-reference.html#usecallback), but will also provide an API for your callbacks to work with Recoil state.  This hook can be used to construct a callback that has access to a read-only [`Snapshot`](/docs/api-reference/core/Snapshot) of Recoil state and the ability to asynchronously update current Recoil state.

Some motivations for using this hook may include:
* Asynchronously read Recoil state without subscribing a React component to re-render if the atom or selector is updated.
* Deferring expensive lookups to an async action that you don't want to do at render-time.
* Performing side-effects where you would like to also read or write to Recoil state.
* Dynamically updating an atom or selector where we may not know at render-time which atom or selector we will want to update, so we can't use [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState).
* [Pre-fetching](/docs/guides/asynchronous-data-queries#pre-fetching) data before rendering.

---

```jsx
type CallbackInterface = {
  snapshot: Snapshot,
  gotoSnapshot: Snapshot => void,
  set: <T>(RecoilState<T>, (T => T) | T) => void,
  reset: <T>(RecoilState<T>) => void,
};

function useRecoilCallback<Args, ReturnValue>(
  callback: CallbackInterface => (...Args) => ReturnValue,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => ReturnValue
```

* **`callback`** - The user callback function with a wrapper function that provides a callback interface.  Callbacks to change the state will be queued to asynchronously update the current Recoil state.  The type signature of the wrapped function matches the type signature of the returned callback.
* **`deps`** - An optional set of dependencies for memoizing the callback.  Like `useCallback()`, the produced callback will not be memoized by default and will produce a new function with each render.  You can pass an empty array to always return the same function instance.  If you pass values in the `deps` array a new function will be used if the reference equality of any dep changes.  Those values can then be used from within the body of your callback without getting stale.  (See [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback))  You can [update eslint](/docs/introduction/installation#eslint) to help ensure this is used correctly.

Callback Interface:
* **`snapshot`** - The [`Snapshot`](/docs/api-reference/core/Snapshot) provides a read-only look at Recoil atom state committed with a React batch when the current transaction the callback is called from began.  While the atom values are static, asynchronous selectors may still be pending or resolve.
* **`gotoSnapshot`** - Enqueue updating the global state to match the provided [`Snapshot`](/docs/api-reference/core/Snapshot).
* **`set`** - Enqueue setting the value of an atom or selector.  Like elsewhere, you may either provide the new value directly or an updater function that returns the new value and takes the current value as a parameter.  The current value represents all other enqueued state changes to date in the current transaction.
* **`reset`** - Reset the value of an atom or selector to its default.

### Lazy Read Example

This example uses **`useRecoilCallback()`** to lazily read state without subscribing a component to re-render when the state changes.

```jsx
import {atom, useRecoilCallback} from 'recoil';

const itemsInCart = atom({
  key: 'itemsInCart',
  default: 0,
});

function CartInfoDebug() {
  const logCartItems = useRecoilCallback(({snapshot}) => async () => {
    const numItemsInCart = await snapshot.getPromise(itemsInCart);
    console.log('Items in cart: ', numItemsInCart);
  });

  return (
    <div>
      <button onClick={logCartItems}>Log Cart Items</button>
    </div>
  );
}
```
