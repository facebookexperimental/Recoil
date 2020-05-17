---
title: useSetRecoilState()
sidebar_label: useSetRecoilState()
---

Returns a setter function for updating the value of writeable Recoil state.

---

- `state`: writeable Recoil state (an [`atom`](/docs/api-reference/core/atom) or a _writeable_ [`selector`](/docs/api-reference/core/selector))

This is the recommended hook to use when a component intends to write to state without reading it.

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
