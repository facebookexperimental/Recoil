---
title: 测试
---

## 在 React 之外测试 Recoil Selectors

在 React 上下文之外操作和评估 Recoil selectors 以进行测试是非常有用的。这可以通过使用 Recoil [`Snapshot`](/docs/api-reference/core/Snapshot) 来实现。您可以使用 `snapshot_UNSTABLE()` 生成一个新的快照，然后使用该 `Snapshot` 来评估用于测试的 selectors。

### 示例: Jest 单元测试 selectors

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
