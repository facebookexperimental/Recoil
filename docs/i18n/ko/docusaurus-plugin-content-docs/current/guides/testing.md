---
title: Testing
---

## Testing Recoil Selectors outside of React (Recoil Selectors를 리액트 외부에서 테스트하기)

테스트를 위해서 React Context를 외부에서 Recoil Selectors를 조작하고 평가하는 것은 유용할 수 있습니다. 이 부분은 Recoil [`Snapshot`](https://recoiljs.org/docs/api-reference/core/Snapshot)으로 작업하여 수행할 수 있습니다. `snapshot_UNSTABLE()`을 사용해 새로운 snapshot을 빌드할 수 있습니다. 그리고 테스트를 위해서 그 `Snapshot`을 사용하여 selectors를 평가할 수 있습니다.

### Example: Jest unit testing selectors (예제: Jest 유닛 테스트 Selectors)

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

