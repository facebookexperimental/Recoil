---
title: useRecoilTransaction_UNSTABLE(callback, deps)
sidebar_label: useRecoilTransaction()
---

pending dependencies
selectors
selector set
async
useRecoilCallback transact
Promise return value

Create a transaction callback which can be used to atomically update multiple atoms in a safe, easy, and performant way.  Provide a callback which executes the transaction and can `get()` or `set()` multiple atoms.  A transaction is similar to the "updater" form of setting Recoil state, but over multiple atoms.  Writes are visible to subsequent reads from within the same transaction.

In addition to transactions, this hook is also useful to:
* Implement reducer patterns to perform actions on multiple atoms.
* Dynamically updating an atom where we may not know at render-time which atom or selector we will want to update, so we can't use [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState).
* [Pre-fetching](/docs/guides/asynchronous-data-queries#pre-fetching) data before rendering.

---

```jsx
interface TransactionInterface {
  get: <T>(RecoilValue<T>) => T;
  set: <T>(RecoilState<T>,  (T => T) | T) => void;
  reset: <T>(RecoilState<T>) => void;
}

function useRecoilTransaction_UNSTABLE<Args>(
  callback: TransactionInterface => (...Args) => void,
  deps?: $ReadOnlyArray<mixed>,
): (...Args) => void
```

* **`callback`** - User callback function with a wrapper function that provides the transaction interface.  ***This function must be pure without any side-effects.***
* **`deps`** - An optional set of dependencies for memoizing the callback.  Like `useCallback()`, the produced transaction callback will not be memoized by default and will produce a new function with each render.  You can pass an empty array to always return the same function instance.  If you pass values in the `deps` array, a new function will be used if the reference equality of any dep changes.  Those values can then be used from within the body of your callback without getting stale.  (See [`useCallback`](https://reactjs.org/docs/hooks-reference.html#usecallback))  You can [update eslint](/docs/introduction/installation#eslint) to help ensure this is used correctly.

Transaction Interface:
* **`get`** - Get the current value for the requested Recoil state, reflecting any writes performed earlier in the transaction.  This currently only supports synchronous atoms.
* **`set`** - Set the value of an atom.  You may either provide the new value directly or an updater function that returns the new value and takes the current value as a parameter.  The current value represents all other pending state changes to date in the current transaction.
* **`reset`** - Reset the value of an atom to its default.

### Transaction Example

Suppose we have two atoms, `positionState` and `headingState`, and we'd like to update them together as part of a single action, where the new value of `positionState` is a function of *both* the current value of `positionState` and `headingState`.

```jsx
const goForward = useRecoilTransaction_UNSTABLE(({get, set}) => (distance) => {
  const heading = get(headingState);
  const position = get(positionState);
  set(positionAtom, {
    x: position.x + cos(heading) * distance,
    y: position.y + sin(heading) * distance,
  });
});
```

Then you can execute the transaction by just calling `goForward(distance)` in an event handler.  This will update state based on the *current* values, not the state when the components rendered.

You can also read the values of previous writes during a transaction.  Because no other updates will be committed while the updater is executing, you will see a consistent store of state.

```jsx
const moveInAnL = useRecoilTransaction_UNSTABLE(({get, set}) => () => {
  // Move Forward 1
  const heading = get(headingState);
  const position = get(positionState);
  set(positionState, {
    x: position.x + cos(heading),
    y: position.y + sin(heading),
  });

  // Turn Right
  set(headingState, heading => heading + 90);

  // Move Forward 1
  const newHeading = get(headingState);
  const newPosition = get(positionState);
  set(positionState, {
    x: newPosition.x + cos(newHeading),
    y: newPosition.y + sin(newHeading),
  });
});
```

### Reducer Example

This hook is also useful for implementing reducer patterns to execute actions over multiple atoms:

```jsx
const reducer = useRecoilTransaction_UNSTABLE(({get, set}) => action => {
  switch(action.type) {
    case 'goForward':
      const heading = get(headingState);
      set(positionState, position => {
        x: position.x + cos(heading) * action.distance,
        y: position.y + sin(heading) * action.distance,
      });
      break;

    case 'turn':
      set(headingState, action.heading);
      break;
  }
});
```

### Current Limitations and Future Vision

* Transactions currently only support atoms, not yet selectors.  This support can be added in the future.
* Atoms that are read must have a synchronous value.  If it is in an error state or an asynchronous pending state, then the transaction will throw an error.  It would be possible to support pending dependencies by aborting the transaction if a dependency is pending and then re-starting the transaction when it is available.  This is consistent with how the selector `get()` is implemented.
* Transactions do not have a return value.  If we want to have some notification a transaction completes, or use transactions to request slow data, or to request data from event handlers, then we could have a transaction return a `Promise` to a return value.
* Transactions must be synchronous.  There is a proposal to allow asynchronous transactions.  The user could provide an `async` transaction callback function which could use `await`.  The atomic update of all sets would not be applied, however, until the `Promise` returned by the transaction is fully resolved.
* Transactions must not have any side-effects.  If you require side-effects, then use [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) instead.
