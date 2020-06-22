---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

Provides the context in which atoms have values. Must be an ancestor of any component that uses any Recoil hooks. Multiple roots may co-exist; atoms will have distinct values within each root. If they are nested, the innermost root will completely mask any outer roots.

---

**Props**:
- `initializeState?`: `(MutableSnapshot => void)`
  - An optional function that takes a [`MutableSnapshot`](/docs/api-reference/core/Snapshot#Transforming_Snapshots) to initialize the global state.


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
