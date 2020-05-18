---
title: useSetRecoilState()
sidebar_label: useSetRecoilState()
---

Returns a setter function for updating the value of writeable Recoil state.

---

- `state`: writeable Recoil state (an [`atom`](/docs/api-reference/core/atom) or a _writeable_ [`selector`](/docs/api-reference/core/selector))

This is the recommended hook to use when a component intends to write to state without reading it. If a component used the `useRecoilState()` hook to get the setter, it would also subscribe to updates and re-render when the atom or selector updated. Using `useSetRecoilState()` allows a component to set the value without re-rendering when the value changes.

### Example

```javascript
import { atom, useSetRecoilState } from 'recoil';

const namesState = atom({
  key: 'namesState',
  default: ['Ella', 'Chris', 'Paul'],
});

function NameInput() {
  const [name, setName] = useState('');
  const setNamesState = useSetRecoilState(namesState);

  const addName = () => {
    setNamesState(existingNames => [...existingNames, name]);
  };

  const onChange = (e) => {
    setName(e.target.value);
  };

  return (
    <>
      <input type="text" value={name} onChange={onChange} />
      <button onClick={addName}>Add Name</button>
    </>
  );
}
```
