---
title: <RecoilRoot ...props />
sidebar_label: <RecoilRoot />
---

값을 가진 atom 컨텍스트를 제공합니다. Recoil의 hooks을 사용하는 모든 컴포넌트의 상위 단계(ancestor)로 설정해야 합니다.

---

**속성**:

- `initializeState?`: `(MutableSnapshot => void)`
  - [`MutableSnapshot`](/docs/api-reference/core/Snapshot#transforming-snapshots)을 사용하여 `<RecoilRoot>`의 atom 상태를 초기화하는 optional 함수. 이는 초기 렌더링 시 상태를 설정하는 데에 사용되며, 이후 상태 변경이나 비동기적인 초기화를 위한 용도가 아닙니다. 비동기 상태 변경에는 [`useSetRecoilState()`](/docs/api-reference/core/useSetRecoilState) 또는 [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback)과 같은 Hooks를 사용하세요.
  [Atom Effects](/docs/guides/atom-effects)는 동적 atom을 더 쉽게 초기화하며 초기화 로직을 atom 정의와 함께 배치하는 데 사용할 수 있습니다. Atom Effect 초기화는 `initializeState` 보다 우선적으로 처리됩니다.
- `override?`: `boolean`
  - 기본값은 `true`입니다. 이는 `<RecoilRoot>`가 다른 `<RecoilRoot>`와 중첩(nested)된 경우에만 사용됩니다. `override`가 `true`일 경우, 해당 루트는 새로운 Recoil 범위(scope)를 생성합니다. `override`가 `false`일 경우, 해당 `<RecoilRoot>`는 자식 요소(children)를 렌더링하는 것 외에 다른 동작을 수행하지 않습니다. 따라서 이 루트의 자식 요소는 가장 가까운 상위 RecoilRoot의 Recoil 값에 접근합니다.

### 여러 개의 `<RecoilRoot>`를 사용하는 경우

`<RecoilRoot>`는 여러 개가 같이 존재할 수 있고, 각각이 독립적인 atom 상태의 providers/store가 됩니다. atom은 각 루트에 따라 다른 값을 갖게 됩니다. 그리고 이 동작은 `override`를 `false`로 지정하지 않는 한, 루트가 다른 루트 안에 중첩되는 경우(내부 루트가 외부 루트를 가릴 경우) 동일하게 유지됩니다. ("속성" 참조)

Selector 캐시와 같은 캐시는 루트 사이에서 공유될 수 있다는 점을 유의하세요. Selector 평가는 캐싱이나 로깅을 제외하고는 멱등적(연산을 여러번 적용해도 결과가 달라지지 않음)이어야 하므로 일반적으로 문제가 되지 않습니다. 그러나 이 동작은 관찰될 수 있으며(observable), 루트 간에 중복된 쿼리가 캐시되는 상황을 초래할 수 있습니다. 캐시는 [`useRecoilRefresher_UNSTABLE()`](/docs/api-reference/core/useRecoilRefresher)를 사용하여 지울 수 있습니다.

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
