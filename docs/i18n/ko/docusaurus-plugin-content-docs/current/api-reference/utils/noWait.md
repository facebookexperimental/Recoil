---
title: noWait(state)
sidebar_label: noWait()
---

제공된 [`atom`](/docs/api-reference/core/atom) 혹은 [`selector`](/docs/api-reference/core/selector)의 현재 상태에 대한 [`Loadable`](/docs/api-reference/core/Loadable)객체를 반환하는 selector helper입니다.

```jsx
function noWait<T>(state: RecoilValue<T>): RecoilValueReadOnly<Loadable<T>>
```

---

이 helper를 사용하면 에러가 존재하거나 종속이 아직 보류중인 경우 에러를 발생시키지 않고 잠재적인 비동기 종속의 현재 상태를 가져올 수 있습니다. 이 helper는 [`useRecoilValueLoadable()`](/docs/api-reference/core/useRecoilValueLoadable)와 비슷하지만, hook이 아닌 selector라는 점이 다릅니다. `noWait()`은 selector를 반환하기 때문에, 다른 Recoil selector들과 hook에서 함께 사용할 수 있습니다.

### Example

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
