---
title: waitForAny(dependencies)
sidebar_label: waitForAny()
---

A concurrency helper that returns a set of [`Loadable`s](/docs/api-reference/core/Loadable) for the current state of the requested dependencies.  It waits until at least one of the dependencies are available.

The dependencies may either be provided as a tuple array or as named dependencies in an object.

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

`waitForAny()` is similar to [`waitForNone()`](/docs/api-reference/utils/waitForNone), except that it waits until at least one dependency has a value available instead of returning immediately.
