---
title: constSelector(constant)
---

A [selector](/docs/api-reference/core/selector) which always provides a constant value.

```jsx
function constSelector<T: Parameter>(constant: T): RecoilValueReadOnly<T>
```

A `constSelector` may be useful if you have an interface that uses a type such as `RecoilValue<T>` or `RecoilValueReadOnly<T>` that may be provided by different selector implementations.

These selectors will memoize based on reference value equality.  So, `constSelector()` can be called multiple times with the same value and the same selector will be provided.  Because of this, the value used as a contant is restricted to types that may be serialized using the Recoil serialization.  Please see documentation in [`selectorFamily`](/docs/api-reference/utils/selectorFamily) describing the limitations.

### Example

```jsx
type MyInterface = {|
  queryForStuff: RecoilValue<Thing>,
  ...
|};

const myIntefaceInstance1 = {
  queryForStuff: selectorThatDoesQuery,
};

const myInterfaceInstance2 = {
  queryForStuff: constSelector(thing),
};
```
