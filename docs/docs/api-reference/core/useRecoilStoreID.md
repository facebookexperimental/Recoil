---
title: useRecoilStoreID()
sidebar_label: useRecoilStoreID()
---

Provides a `StoreID` associated with the currently active [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot).

---

```jsx
function useRecoilStoreID(): StoreID
```

The `StoreID` is associated with the closest ancestor [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) (which does not have the `override` prop set to `false` with another ancestor) or [`<RecoilBridge>`](/docs/api-reference/core/useRecoilBridgeAcrossReactRoots).

The type of `StoreID` is opaque.  The ID provided matches the `storeID` passed to atom effects that are associated with the same `<RecoilRoot>`.
