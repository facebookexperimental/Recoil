---
title: constSelector(constant)
sidebar_label: constSelector()
---

항상 상수를 제공하는 [selector](/docs/api-reference/core/selector)입니다.

```jsx
function constSelector<T: Parameter>(constant: T): RecoilValueReadOnly<T>
```

`constSelector`는 다른 selector 구현에 의해 제공될 수 있는 `RecoilValue<T>`나 `RecoilValueReadOnly<T>`같은 인터페이스가 있는 경우 유용합니다.

이 selector들은 기준값 동등성을 기준으로 메모이제이션됩니다. 따라서, `constSelector()`는 동일한 값으로 여러번 호출할 수 있으며 동일한 selector가 제공됩니다. 때문에 상수로 사용되는 값은 Recoil 직렬화(serialization)를 사용해 직렬화 할 수 있는 타입으로 제한됩니다. [`selectorFamily`](/docs/api-reference/utils/selectorFamily)문서에 작성된 한계에 대해 살펴보세요.

### Example

```jsx
type MyInterface = {
  queryForStuff: RecoilValue<Thing>,
  ...
};

const myInterfaceInstance1: MyInterface = {
  queryForStuff: selectorThatDoesQuery,
};

const myInterfaceInstance2: MyInterface = {
  queryForStuff: constSelector(thing),
};
```
