---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

Provides the context in which atoms have values. Must be an ancestor of any component that uses any Recoil hooks. Multiple roots may co-exist; atoms will have distinct values within each root. If they are nested, the innermost root will completely mask any outer roots.

---

**Props**:
- `initializeState?`: `(MutableSnapshot => void)`
  - An optional function that takes a [`MutableSnapshot`](/docs/api-reference/core/Snapshot#transforming-snapshots) to [initialize](/docs/api-reference/core/Snapshot#state-initialization) the `<RecoilRoot>` atom state.  This sets up the state for the initial render and is not intended for subsequent state changes or async initialization.  Use hooks such as [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState) or [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) for async state changes.

---

`<RecoilRoot>`'s represent independent providers/stores of atom state.  Note that caches, such as selector caches, may be shared across roots.  Selector evaluations must be idempotent except for caching or logging, so this should not be a problem, but may be observable or may cause redundant queries to be cached across roots.

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
