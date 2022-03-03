---
title: Testing
---

## Testing Recoil state inside of a React component

It can be helpful to test Recoil state when testing a component. You can compare the new state against expected values using this pattern. It uses a React functional component, `useRecoilValue` and `useEffect`, to observe an `atom`/`selector`'s changes and execute a callback every time the user performs an action that modifies the state.

```jsx
export const RecoilObserver = ({node, onChange}) => {
  const value = useRecoilValue(node);
  useEffect(() => onChange(value), [onChange, value]);
  return null;
};
```

- **`node`**: can be an atom or a selector.
- **`onChange`**: this function will be called every time the state changes.

### Example: Form state modified by user

#### Component

```jsx
const nameState = atom({
  key: 'nameAtom',
  default: '',
});

function Form() {
  const [name, setName] = useRecoilState(nameState);
  return (
    <form>
      <input
        data-testid="name_input"
        type="text"
        value={name}
        onChange={event => setName(event.target.value)}
      />
    </form>
  );
}
```

#### Test

```jsx
describe('The form state should', () => {
  test('change when the user enters a name.', () => {
    const onChange = jest.fn();

    render(
      <RecoilRoot>
        <RecoilObserver node={nameState} onChange={onChange} />
        <Form />
      </RecoilRoot>,
    );

    const component = screen.getByTestId('name_input');

    fireEvent.change(component, {target: {value: 'Recoil'}});

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith(''); // Initial state on render.
    expect(onChange).toHaveBeenCalledWith('Recoil'); // New value on change.
  });
});
```

## Testing Recoil state with asynchronous queries inside of a React component

A common pattern for atoms is using asynchronous queries fetch the state of the atom, in a selector, or as part of an effect. This causes the component to be suspended. However, while testing, the component is suspended will not update in the DOM without acting. To test this scenario, we need a helper function:

```jsx
// act and advance jest timers
function flushPromisesAndTimers(): Promise<void> {
  return act(
    () =>
      new Promise(resolve => {
        setTimeout(resolve, 100);
        jest.runAllTimers();
      }),
  );
}
```

### Example: Title with data returned from asynchronous data query

#### Component

```jsx
const getDefaultTitleAtomState = async () => {
  const response = await fetch('https://example.com/returns/a/json');
  return await response.json(); // { title: 'real title' };
};

const titleState = atom({
  key: 'titleState',
  default: getDefaultTitleAtomState(),
});

function Title() {
  const data = useRecoilValue(titleState);
  return (
    <div>
      <h1>{data.title}</h1>
    </div>
  );
}
```

#### Test

```jsx
describe('Title Component', () => {
  test('display the title correctly', async () => {
    const mockState = {title: 'test title'};
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockState),
      }),
    );

    render(
      <RecoilRoot>
        <Suspense fallback={<div>loading...</div>}>
          <Title />
        </Suspense>
      </RecoilRoot>,
    );
    await flushPromisesAndTimers();

    expect(screen.getByText(mockState.title)).toBeInTheDocument();
    expect(screen.getByText('loading...')).not.toBeInTheDocument();
  });
});
```

## Testing Recoil state inside a Custom Hook

Sometimes it is convenient to write custom React hooks that rely on Recoil state. These need to be wrapped in a `<RecoilRoot>`. The [React Hooks Testing Library](https://react-hooks-testing-library.com/) can help with this pattern.

### Example: React Hooks Testing Library

#### State

```jsx
const countState = atom({
  key: 'countAtom',
  default: 0,
});
```

#### Hook

```jsx
const useMyCustomHook = () => {
  const [count, setCount] = useRecoilState(countState);
  // Insert other Recoil state here...
  // Insert other hook logic here...
  return count;
};
```

#### Test

```jsx
test('Test useMyCustomHook', () => {
  const {result} = renderHook(() => useMyCustomHook(), {
    wrapper: RecoilRoot,
  });
  expect(result.current).toEqual(0);
});
```

## Testing Recoil state outside of React

It can be useful to manipulate and evaluate Recoil selectors outside of a React context for testing. This can be done by working with a Recoil [`Snapshot`](/docs/api-reference/core/Snapshot). You can build a fresh snapshot using `snapshot_UNSTABLE()` and then use that `Snapshot` to evaluate selectors for testing.

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
});
```

### Testing async selectors

When testing **async selectors** it is necessary to `retain()` the snapshot in order to avoid early cancelation.

```jsx
const initialSnapshot = snapshot_UNSTABLE();
const release = initialSnapshot.retain();

try {

  // your test

} finally {
  release();
}
```

### Clearing all selector caches

Selector caches are shared between `<RecoilRoot>`'s and tests, so you may need to clear the cache after each test.

```jsx
const clearSelectorCachesState = selector({
  key: 'ClearSelectorCaches',
  get: ({getCallback}) => getCallback(({snapshot, refresh}) => () => {
    for (const node of snapshot.getNodes_UNSTABLE()) {
      refresh(node);
    }
  }),
});

const clearSelectorCaches = testingSnapshot.getLoadable(clearSelectorCachesState).getValue();

// Assuming we're in a file added to Jest's setupFilesAfterEnv:
afterEach(clearSelectorCaches);
```
