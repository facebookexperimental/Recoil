---
title: useRecoilStoreID()
sidebar_label: useRecoilStoreID()
---

현재 활성화된 `<RecoilRoot>` 와 관련된 `StoreID` 를 반환합니다.

---

```jsx
function useRecoilStoreID(): StoreID
```

`StoreID` 는 가장 가까운 조상 `<RecoilRoot>` (다른 조상에 대해 override prop이 false로 설정되어 있지 않은 경우) 또는 `<RecoilBridge>` 와 연결됩니다.

  `StoreID` 타입은 불투명합니다. 반환된 ID는 동일한 `<RecoilRoot>` 와 연결된 atom effects 에 전달된 `storeID` 와 일치합니다.
