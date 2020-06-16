---
title: atom(options)
sidebar_label: atom()
---

An *atom* represents state in Recoil.  The `atom()` function returns a writeable `RecoilState` object.

---

```jsx
function atom<T>({
  key: string,
  default: T | Promise<T> | RecoilValue<T>,

  dangerouslyAllowMutability?: boolean,
}): RecoilState<T>
```


  - `key` - A unique string used to identify the atom internally. This string should be unique with respect to other atoms and selectors in the entire application.
  - `default` - The initial value of the atom or a `Promise` or another atom or selector representing a value of the same type.
  - `dangerouslyAllowMutability` - Recoil depends on atom state changes to know when to notify components that use the atoms to re-render.  If an atom's value were mutated, it may bypass this and cause state to change without properly notifying subscribing compoennts.  To help protect against this all stored values are frozen.  In some cases it may be desireable to override this using this option.

---

Most often, you'll use the following hooks to interact with atoms:

- [`useRecoilState()`](/docs/api-reference/core/useRecoilState): Use this hook when you intend on both reading and writing to the atom. This hook subscribes the component to the atom.
- [`useRecoilValue()`](/docs/api-reference/core/useRecoilValue): Use this hook when you intend on only reading the atom. This hook subscribes the component to the atom.
- [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState): Use this hook when you intend on only writing to the atom.
- [`useResetRecoilState()`](/docs/api-reference/core/useResetRecoilState): Use this hook to reset an atom to its default value.

For rare cases where you need to read an atom's value without subscribing to the component see [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback).

You can initialize an atom either with a static value or with a `Promise` or a `RecoilValue` representing a value of the same type.  Because the `Promise` may be pending or the default selector may be asynchronous it means that the atom value may also be pending or throw an error when reading.  Note that you cannot currently assign a `Promise` when setting an atom.  Please use [selectors](/docs/api-reference/core/selector) for async functions.

Atoms cannot be used to store `Promise`s or `RecoilValues` directly, but they may be wrapped in an object.  Note that `Promises` may be mutable.

### Example

```jsx
import {atom, useRecoilState} from 'recoil';

const counter = atom({
  key: 'myCounter',
  default: 0,
});

function Counter() {
  const [count, setCount] = useRecoilState(counter);
  const incrementByOne = () => setCount(count + 1);

  return (
    <div>
      Count: {count}
      <br />
      <button onClick={incrementByOne}>Increment</button>
    </div>
  );
}
```
