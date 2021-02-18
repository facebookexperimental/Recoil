---
title: Testing
---

## Testing Recoil Selectors outside of React

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
