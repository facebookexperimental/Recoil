---
title: atom(options)
sidebar_label: atom()
---

Returns writeable Recoil state.

---

- `options`
  - `key`: A unique string used to identify the atom internally. This string should be unique with respect to other atoms and selectors in the entire application.
  - `default`: The initial value of the atom.

Most often, you'll use the following hooks to interact with atoms:

- [`useRecoilState()`](/docs/api-reference/core/useRecoilState): use this hook when you intend on both reading and writing to the atom. This hook subscribes the component to the atom.
- [`useRecoilValue()`](/docs/api-reference/core/useRecoilValue): use this hook when you intend on only reading the atom. This hook subscribes the component to the atom.
- [`useSetRecoilState()`](/docs/api-reference/core/useRecoilState): use this hook when you intend on only writing to the atom.

For rare cases where you need to read an atom's value without subscribing the component, see [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback).

### Example

```javascript
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
