---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

값들을 갖는 원자 컨텍스트를 제공한다. Recoil의 hooks를 사용하는 모든 구성 요소의 조상이어야 한다. 여러개의 루트가 같이 존재할 수 있다. 원자는 각각의 루트 안에서 구별되는 값들을 가질 것 이다. 만약 그것들이 중첩되어 있다면, 가장 안쪽의 루트는 완벽하게 바깥쪽의 루트들을 가릴 것이다.

---

**Props**:

- `initializeState?`: `(MutableSnapshot => void)`
  - [`MutableSnapshot`](/docs/api-reference/core/Snapshot#transforming-snapshots)을 사용하여 `<RecoilRoot>`의 원자 상태를 초기화하는 옵션 함수. 이것은 초기 렌더링에 대한 상태를 설정하며 이후 상태 변경이나 비동기적인 초기화를 위한 것이 아니다. 비동기 상태 변경에는 [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState) 또는 [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback)과 같은 Hooks를 사용하십시오.

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
