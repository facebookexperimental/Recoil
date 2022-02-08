---
title: 테스팅
---

## 리액트 컴포넌트 내부에서 Recoil 상태 테스트하기

컴포넌트를 테스트할 때 Recoil 상태를 테스트하는 것은 도움이 될 수 있습니다. 이 패턴을 사용해 새로운 상태를 기댓값과 비교할 수 있습니다. `useRecoilValue` 와 `useEffect` 를 사용해 `atom`/`selector` 의 변화를 감지하고 사용자가 상태를 변경하는 액션을 수행할 때마다 콜백을 실행합니다.

```jsx
export const RecoilObserver = ({node, onChange}) => {
  const value = useRecoilValue(node);
  useEffect(() => onChange(value), [onChange, value]);
  return null;
};
```

- **`node`**: atom 또는 selector 가 될 수 있습니다.
- **`onChange`**: 이 함수는 상태가 변화할 때마다 호출됩니다.

### 예시: 사용자에 의해 변화하는 폼 상태

#### 컴포넌트

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

#### 테스트

```jsx
describe('The form state should', () => {
  test('change when the user enters a name.', () => {
    const onChange = jest.fn();

    render(
      <RecoilRoot>
        <RecoilObserver node={nameAtom} onChange={onChange} />
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

## 리액트 컴포넌트 내부의 비동기 쿼리를 사용해 Recoil 상태 테스팅하기

Atom을 사용하는 일반적인 패턴은 비동기 쿼리를 사용해 atom의 상태, selector 또는 effect의 일부로 불러오는 것으로, 이로 인해 컴포넌트가 일시적으로 중단됩니다. 그러나, 테스트 도중에는 컴포넌트가 중단되어도 DOM에서 작업을 수행하지 않고 업데이트를 수행하지 않을 것입니다. 이 시나리오를 테스트하기 위해서는 헬퍼 함수가 필요합니다.

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

### 예시: 비동기 데이터 쿼리에서 반환된 데이터를 사용하는 Title

#### 컴포넌트

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

#### 테스트

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

## 커스텀 훅 내부에서 Recoil 상태 테스트하기

때로는 Recoil 상태에 의존하는 커스텀 훅을 작성하는 것이 편리합니다. 이 훅들은 `<RecoilRoot>` 로 감싸져야만 합니다. 이 패턴은 [React Hooks Testing Library](https://react-hooks-testing-library.com/)에서 확인할 수 있습니다.

### 예제: React Hooks Testing Library

#### 상태

```jsx
const countState = atom({
  key: 'countAtom',
  default: 0,
});
```

#### 훅

```jsx
const useMyCustomHook = () => {
  const [count, setCount] = useRecoilState(countState);
  // Insert other Recoil state here...
  // Insert other hook logic here...
  return count;
};
```

#### 테스트

```jsx
test('Test useMyCustomHook', () => {
  const {result} = renderHook(() => useMyCustomHook(), {
    wrapper: RecoilRoot,
  });
  expect(result.current).toEqual(0);
});
```

## 리액트 바깥에서 Recoil 상태 테스트하기

테스트를 위해 리액트 바깥에서 Recoil selector를 조작하고 평가하는 것이 유용할 수도 있습니다. 이는 Recoil [`Snapshot`](/docs/api-reference/core/Snapshot)으로 작업할 수 있습니다. `snapshot_UNSTABLE` 을 사용해 새 스냅샷을 생성한 다음 `Snapshot`을 사용해 테스트할 selector를 평가할 수 있습니다.

### 예시: Jest로 selectors에 유닛 테스팅하기

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

### 모든 selector의 캐시 비우기

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

clearSelectorCaches();
```
