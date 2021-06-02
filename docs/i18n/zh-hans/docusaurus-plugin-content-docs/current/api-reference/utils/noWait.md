---
title: noWait(state)
sidebar_label: noWait()
---

一个 selector helper 方法，返回值为代表所提供的 [`atom`](/docs/api-reference/core/atom) 或 [`selector`](/docs/api-reference/core/selector) 当前状态的 [`Loadable`](/docs/api-reference/core/Loadable)。

```jsx
function noWait<T>(state: RecoilValue<T>): RecoilValueReadOnly<Loadable<T>>
```

---

此 helper 方法可用于获取潜在异步依赖项的当前状态，在出现错误或依赖项仍然处于 pending 时不会抛出。它类似于 [`useRecoilValueLoadable()`](/docs/api-reference/core/useRecoilValueLoadable)，只不过它是一个 selector，而并非一个钩子函数。因为 `noWait()` 返回一个 selector，所以它可以被其他 Recoil selectors 以及钩子所使用。

### 示例

```jsx
const myQuery = selector({
  key: 'MyQuery',
  get: ({get}) => {
    const loadable = get(noWait(dbQuerySelector));

    return {
      hasValue: {data: loadable.contents},
      hasError: {error: loadable.contents},
      loading: {data: 'placeholder while loading'},
    }[loadable.state];
  }
})

```
