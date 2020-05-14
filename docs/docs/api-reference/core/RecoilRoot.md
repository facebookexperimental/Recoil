---
title: <RecoilRoot />
sidebar_label: <RecoilRoot />
---

The entry point of an application that uses Recoil.

---

- `props`
  - `initializeState`: optional.

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
