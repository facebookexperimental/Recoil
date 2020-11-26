---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

Provides the context in which atoms have values. Must be an ancestor of any component that uses any Recoil hooks. Multiple roots may co-exist; atoms will have distinct values within each root. If they are nested, the innermost root will completely mask any outer roots.

Note: This does **not** mean that `RecoilRoot`s are always completely isolated from each other. For example, a selector that does not depend on any atom may have its result cached across roots. This can cause problems if the selector reads external resources, especially in tests that only render a new `RecoilRoot` for every test, but do not [reset](/docs/guides/asynchronous-data-queries#use-a-request-id) the selector in any way.

---

**Props**:
- `initializeState?`: `(MutableSnapshot => void)`
  - An optional function that takes a [`MutableSnapshot`](/docs/api-reference/core/Snapshot#transforming-snapshots) to initialize the `<RecoilRoot>` atom state.  This sets up the state for the initial render and is not intended for subsequent state changes or async initialization.  Use hooks such as [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState) or [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) for async state changes.


### Example

```jsx
import {RecoilRoot} from 'recoil';

function AppRoot() {
  return (
    <RecoilRoot>
      <ComponentThatUsesRecoil />
    </RecoilRoot>
  );
}
```
