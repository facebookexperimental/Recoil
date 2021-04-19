---
title: waitForAny(dependencies)
sidebar_label: waitForAny()
---

요청된 종속성의 현재 상태에 대한 [`Loadable`](/docs/api-reference/core/Loadable) 집합을 반환하는 동시성(concurrency) helper 입니다. 종속성 중 하나 이상을 사용할 수 있을 때까지 기다립니다.

종속성들은 튜플 배열 또는 객체에 명명된 종속성으로 제공됩니다.

---

```jsx
function waitForAny(dependencies: Array<RecoilValue<>>):
  RecoilValueReadOnly<UnwrappedArrayOfLoadables>
```

```jsx
function waitForAny(dependencies: {[string]: RecoilValue<>}):
  RecoilValueReadOnly<UnwrappedObjectOfLoadables>
```
---

`waitForAny()`는 [`waitForNone()`](/docs/api-reference/utils/waitForNone)와 비슷하지만, 적어도 하나의 종속성이 즉시 반환되지 않고 사용 가능한 값을 가질 때까지 기다린다는 점에서 다릅니다.