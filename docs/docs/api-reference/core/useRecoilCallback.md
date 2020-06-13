---
title: useRecoilCallback(callback)
sidebar_label: useRecoilCallback()
---

***NOTE***: *Minor changes to this API are expected soon.*

----

This hook is similar to [*`useCallback()`*](https://reactjs.org/docs/hooks-reference.html#usecallback), but will also provide an API for your callbacks to work with Recoil state.  This hook can be used to construct a callback that has access to a read-only *snapshot* of Recoil state and the ability to asynchronously update current Recoil state.

Some motivations for using this hook may include:
* Asynchronously read Recoil state without subscribing a React component to re-render if the atom or selector is updated.
* Defering expensive lookups to an async action that you don't want to do at render-time.
* Dynamically updating an atom or selector where we may not know at render-time which atom or selector we will want to update, so we can't use [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState).
* [Pre-fetching](/docs/guides/asynchronous-data-queries#pre-fetching) data before rendering.

---

```jsx
type CallbackInterface = {
  getPromise: <T>(RecoilValue<T>) => Promise<T>,
  getLoadable: <T>(RecoilValue<T>) => Loadable<T>,
  set: <T>(RecoilState<T>, (T => T) | T) => void,
  reset: <T>(RecoilState<T>) => void,
};

function useRecoilCallback<Args, ReturnValue>(
  fn: (CallbackInterface, ...Args) => ReturnValue,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => ReturnValue
```

* **`fn`** - The user callback function with added callback interface.  The accessor callbacks access a read-only snapshot of Recoil atom state created when the callback is called.  While the atom values are static, asynchronous selectors may still be pending or resolve.  Callbacks to set the state will asynchronously update the current Recoil state.
* **`deps`** - An optional set of dependencies for memoizing the callback.  Like `useCallback()`, the produced callback will not be memoized by default and will produce a new function each time.  You can pass an empty array to always return the same function instance.  If you pass values in the `deps` array a new function will be used if the reference equality of any dep changes.  Those values can then be used from within the body of your callback without getting stale.  (See [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback))

Callback Interface:
* **`getPromise`** - Get a `Promise` to the atom or selector value.  As the callback may be `async`, you can `await` on this to get the actual value of the Recoil state.
* **`getLoadable`** - Provides a `Loadable` object to synchronously inspect the state and value of the atom or selector.
* **`set`** - Update the value of an atom or selector
* **`reset`** - Reset the value of an atom or selector to its default.

### Example

```jsx
import {atom, useRecoilCallback} from 'recoil';

const itemsInCart = atom({
  key: 'itemsInCart',
  default: 0,
});

function CartInfoDebug() {
  const logCartItems = useRecoilCallback(async ({getPromise}) => {
    const numItemsInCart = await getPromise(itemsInCart);

    console.log('Items in cart: ', numItemsInCart);
  });

  return (
    <div>
      <button onClick={logCartItems}>Log Cart Items</button>
    </div>
  );
}
```
