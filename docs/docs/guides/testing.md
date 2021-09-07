---
title: Testing
---

## Testing Recoil state inside of a React component

It can be helpful to test Recoil state when testing a component. You can compare the new state  against expected values using this pattern. It uses a React functional component, `useRecoilValue` and `useEffect`, to observe an `atom`/`selector`'s changes and execute a callback every time the user performs an action that modifies the state.

```jsx
export const RecoilObserver = ({node, onChange} => {
  const value = useRecoilValue(node);
  useEffect(() => onChange(value), [onChange, value]);
  return null;
};
```

* **`node`**: can be an atom or a selector.
* **`onChange`**: this function will be called every time the state changes.

### Example: Form state modified by user

#### Component

```jsx
import {atom, useRecoilState} from 'recoil';

export const nameAtom = atom({
  key: 'nameAtom',
  default: '',
});

function Form() {
  const [name, setName] = useRecoilState(nameAtom);
  return (
    <form>
      <input
        data-testid="name_input"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
    </form>
  );
}

export default Form;
```

#### Test

```jsx
import {RecoilRoot} from 'recoil';
import {fireEvent, render, screen} from '@testing-library/react';

import Form, {nameAtom} from './form';
import {RecoilObserver} from './RecoilObserver';

describe('The form state should', () => {
  test('change when the user enters a name.', () => {
    const onChange = jest.fn();

    render(
      <RecoilRoot>
        <RecoilObserver node={nameAtom} onChange={onChange} />
        <Form />
      </RecoilRoot>
    );

    const component = screen.getByTestId('name_input');

    fireEvent.change(component, {target: {value: 'Recoil'}});

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith(''); // Initial state on render.
    expect(onChange).toHaveBeenCalledWith('Recoil'); // New value on change.
  });
});
```

## Testing Recoil State outside of React

It can be useful to manipulate and evaluate Recoil selectors outside of a React context for testing.  This can be done by working with a Recoil [`Snapshot`](/docs/api-reference/core/Snapshot).  You can build a fresh snapshot using `snapshot_UNSTABLE()` and then use that `Snapshot` to evaluate selectors for testing.

### Example: Jest unit testing selectors

```jsx
const numberState = atom({key: 'Number', default: 0});

const multipliedState = selector({
  key: 'MultipliedNumber',
  get: ({get}) => get(numberState) * 100,
});

test('Test multipliedState', () => {
  const initialSnapshot = snapshot_UNSTABLE();
  expect(initialSnapshot.getLoadable(multipliedState).valueOrThrow()).toBe(0);

  const testSnapshot = snapshot_UNSTABLE(({set}) => set(numberState, 1));
  expect(testSnapshot.getLoadable(multipliedState).valueOrThrow()).toBe(100);
})
```
