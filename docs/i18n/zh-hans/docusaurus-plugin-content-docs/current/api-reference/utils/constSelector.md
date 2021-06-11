---
title: constSelector(constant)
sidebar_label: constSelector()
---

一个永远提供常量值的 [selector](/docs/api-reference/core/selector)。

```jsx
function constSelector<T: Parameter>(constant: T): RecoilValueReadOnly<T>
```

如果你有一个使用有诸如 `RecoilValue<T>` 或 `RecoilValueReadOnly<T>` 类型的接口，而这种类型可能会被不同的选择器实现所提供，那么 `constSelector` 可能很有用。

这些选择器将基于引用值的平等进行记忆。所以`constSelector()` 可以用相同的值多次调用，并且会提供相同的选择器。正因为如此，作为常量使用的值被限制在可以使用 Recoil 序列化的类型上。对于这些限制的更多描述，请参阅 [`selectorFamily`](/docs/api-reference/utils/selectorFamily)。

### 示例

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
