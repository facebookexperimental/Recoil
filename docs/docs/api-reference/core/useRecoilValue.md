---
title: useRecoilValue(state)
sidebar_label: useRecoilValue()
---

Returns the value of the given Recoil state.

This hook will implicitly subscribe the component to the given state.

---

```jsx
function useRecoilValue<T>(state: RecoilValue<T>): T;
```

- `state`: an [`atom`](/docs/api-reference/core/atom) or [`selector`](/docs/api-reference/core/selector)

---

This is the recommended hook to use when a component intends to read state without writing to it, as this hook works with both **read-only state** and **writeable state**. Atoms are writeable state while selectors may be either read-only or writeable. See [`selector()`](/docs/api-reference/core/selector) for more info.

Using this hook in a React component will subscribe the component to re-render when the state is updated.  This hook may throw if the state has an error or is pending asynchronous resolution.  Please see [this guide](/docs/guides/asynchronous-data-queries).

### Example

```jsx
import {atom, selector, useRecoilValue} from 'recoil';

const namesState = atom({
  key: 'namesState',
  default: ['', 'Ella', 'Chris', '', 'Paul'],
});

const filteredNamesState = selector({
  key: 'filteredNamesState',
  get: ({get}) => get(namesState).filter((str) => str !== ''),
});

function NameDisplay() {
  const names = useRecoilValue(namesState);
  const filteredNames = useRecoilValue(filteredNamesState);

  return (
    <>
      Original names: {names.join(',')}
      <br />
      Filtered names: {filteredNames.join(',')}
    </>
  );
}
```
