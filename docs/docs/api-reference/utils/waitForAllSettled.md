---
title: waitForAllSettled(dependencies)
sidebar_label: waitForAllSettled()
---

A concurrency helper that returns a set of [`Loadable`s](/docs/api-reference/core/Loadable) for the current state of the requested dependencies.  It waits until all of the dependencies are either in a value state, or an error state.

The dependencies may either be provided as a tuple array or as named dependencies in an object.

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

`waitForAllSettled()` is similar to [`waitForNone()`](/docs/api-reference/utils/waitForNone), except that it waits while any of the dependencies are in a loading state.
