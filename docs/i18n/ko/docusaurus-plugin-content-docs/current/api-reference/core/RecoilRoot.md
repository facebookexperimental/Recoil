---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

값들을 갖는 원자 컨텍스트를 제공한다. Recoil의 hooks를 사용하는 모든 구성 요소의 조상이어야 한다. 여러개의 루트가 같이 존재할 수 있다. 원자는 각각의 루트 안에서 구별되는 값들을 가질 것 이다. 만약 그것들이 중첩되어 있다면, 가장 안쪽의 루트는 완벽하게 바깥쪽의 루트들을 가릴 것이다.

---

**속성**:

- `initializeState?`: `(MutableSnapshot => void)`
  - [`MutableSnapshot`](/docs/api-reference/core/Snapshot#transforming-snapshots)을 사용하여 `<RecoilRoot>`의 원자 상태를 초기화하는 옵션 함수. 이것은 초기 렌더링에 대한 상태를 설정하며 이후 상태 변경이나 비동기적인 초기화를 위한 것이 아니다. 비동기 상태 변경에는 [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState) 또는 [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback)과 같은 Hooks를 사용하십시오.
- `override?`: `boolean`
  - 기본값은 `true`로 설정되어 있으며, 이 속성은 `<RecoilRoot>`가 다른 `<RecoilRoot>`와 중첩(nested)된 경우에만 상관이 있다. 만약 `override`가 `true`라면, 해당 루트는 새로운 Recoil 범위(scope)를 생성할 것이다. 만약 `override`가 `false`라면, 해당 `<RecoilRoot>`는 단지 자식 렌더링 외에 다른 기능을 수행하지 않기 때문에, 이 루트의 자식들은 가장 가까운 조상 RecoilRoot의 Recoil 값에 액세스할 것이다.

### 여러 `<RecoilRoot>`를 사용하는 경우

`<RecoilRoot>`는 여러개가 같이 존재할 수 있고, 각각이 독립적인 atom 상태의 providers/store가 된다. atom은 각 루트에 따라 다른 값을 갖게 되는 것이다. 그리고 이러한 동작은 `override`를 `false`로 지정하지 않는 한, 루트가 다른 루트에 중첩될 때 (내부 루트가 외부 루트를 가릴 경우) 동일하게 발생된다. ("속성" 참조)

selector 캐시같은 캐시들은 루트 사이에 공유될 수 있다. Selector 평가는 캐싱이나 로깅을 제외하고는 멱등적(연산을 여러번 적용해도 결과가 달라지지 않음)이어야 하므로 문제가 되지는 않지만, observable하게 되거나, 루트 전체에 걸쳐 중복 쿼리가 캐시될 수도 있다.

### 예시

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
