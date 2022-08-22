---
title: waitForAllSettled(dependencies)
sidebar_label: waitForAllSettled()
---

요청된 종속성의 현재 상태에 대한 [`Loadable`s](/docs/api-reference/core/Loadable) 집합을 반환하는 동시성(concurrency) helper입니다. 최소한 모든 종속성이 값 상태 또는 오류 상태가 될 때까지 기다립니다.

종속성들은 튜플 배열 또는 객체에 명명된 종속성으로 제공됩니다.

---

```jsx
function waitForAllSettled(dependencies: Array<RecoilValue<>>):
  RecoilValueReadOnly<UnwrappedArrayOfLoadables>
```

```jsx
function waitForAllSettled(dependencies: {[string]: RecoilValue<>}):
  RecoilValueReadOnly<UnwrappedObjectOfLoadables>
```
---

`waitForAllSettled()`는 [`waitForNone()`](/docs/api-reference/utils/waitForNone)과 비슷하지만, 종속성이 로딩 상태에 있는 동안 대기한다는 점이 다릅니다.
