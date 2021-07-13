---
title: useSetRecoilState(state)
sidebar_label: useSetRecoilState()
---

Returns a setter function for updating the value of writeable Recoil state.

---

```jsx
function useSetRecoilState<T>(state: RecoilState<T>): SetterOrUpdater<T>;

type SetterOrUpdater<T> = (T | (T => T)) => void;
```

- `state`: writeable Recoil state (an [`atom`](/docs/api-reference/core/atom) or a _writeable_ [`selector`](/docs/api-reference/core/selector))

Returns a setter function which can be used asynchronously to change the state.  The setter may either be passed a new value or an updater function which receives the previous value as an argument.

---

This is the recommended hook to use when a component intends to write to state without reading it. If a component used the [`useRecoilState()`](/docs/api-reference/core/useRecoilState) hook to get the setter, it would also subscribe to updates and re-render when the atom or selector updated. Using `useSetRecoilState()` allows a component to set the value without subscribing the component to re-render when the value changes.

### Example

```jsx
import {atom, useSetRecoilState} from 'recoil';

const namesState = atom({
  key: 'namesState',
  default: ['Ella', 'Chris', 'Paul'],
});

function FormContent({setNamesState}) {
  const [name, setName] = useState('');
  
  return (
    <>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => setNamesState(names => [...names, name])}>Add Name</button>
    </>
)}

// This component will be rendered once when mounting
function Form() {
  const setNamesState = useSetRecoilState(namesState);
  
  return <FormContent setNamesState={setNamesState} />;
}
```
