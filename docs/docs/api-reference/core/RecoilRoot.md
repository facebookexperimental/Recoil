---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

Provides the context in which atoms have values. Must be an ancestor of any component that uses any Recoil hooks.

---

### Props
- `initializeState?`: `(MutableSnapshot => void)`
  - An optional function that takes a [`MutableSnapshot`](/docs/api-reference/core/Snapshot#transforming-snapshots) to [initialize](/docs/api-reference/core/Snapshot#state-initialization) the `<RecoilRoot>` atom state.  This sets up the state for the initial render and is not intended for subsequent state changes or async initialization.  Use hooks such as [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState) or [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) for async state changes.
- `override?`: `boolean`
  - Defaults to `true`. This prop only matters when this `<RecoilRoot>` is nested within another `<RecoilRoot>`. If `override` is `true`, this root will create a new Recoil scope. If override is `false`, this `<RecoilRoot>` will perform no function other than rendering its children, thus children of this root will access the Recoil values of the nearest ancestor RecoilRoot.

### Using Multiple `<RecoilRoot>`'s

Multiple `<RecoilRoot>`'s  may co-exist and represent independent providers/stores of atom state; atoms will have distinct values within each root. This behavior remains the same when you nest one root inside anther one (inner root will mask outer roots), unless you specify `override` to be `false` (see "Props").

Note that caches, such as selector caches, may be shared across roots.  Selector evaluations must be idempotent except for caching or logging, so this should not be a problem, but may be observable or may cause redundant queries to be cached across roots.

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
