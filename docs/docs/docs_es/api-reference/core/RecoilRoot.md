---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

Provides the context in which atoms have values. Must be an ancestor of any component that uses any Recoil hooks. Multiple roots may co-exist; atoms will have distinct values within each root. If they are nested, the innermost root will completely mask any outer roots.

---

- `props`
  - `initializeState?`: `({set, setUnvalidatedAtomValues}) => void`.
    - A function that will be called when RecoilStore is first rendered which can set initial values for atoms. It is provided with two arguments:
      - `set`: `<T>(RecoilValue<T>, T) => void`
        - Sets the initial value of a single atom to the provided value.
      - `setUnvalidatedAtomValues`: `(Map<string, mixed>) => void`
        - Sets the initial value for any number of atoms whose keys are the keys in the provided map. As with `useSetUnvalidatedAtomValues`, the validator for each atom will be called when it is next read, and setting an atom without a configured validator will result in an exception.

### Example

```javascript
import {RecoilRoot} from 'recoil';

function AppRoot() {
  return (
    <RecoilRoot>
      <ComponentThatUsesRecoil />
    </RecoilRoot>
  );
}
```
