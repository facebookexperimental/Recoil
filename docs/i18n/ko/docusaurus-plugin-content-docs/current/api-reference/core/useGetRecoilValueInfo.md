---
title: useGetRecoilValueInfo_UNSTABLE()
sidebar_label: useGetRecoilValueInfo()
---

이 훅은 컴포넌트가 하나의 atom 혹은 selector의 현재 상태와 값 그리고 기타 다른 정보들을 살펴볼("peek") 수 있도록 한다. 이 훅은 [`Snapshot`](docs/api-reference/core/Snapshot)의 [`getInfo_UNSTABLE()`](/docs/api-reference/core/Snapshot#debug-information) 메소드와 유사하다.

```jsx
function useGetRecoilValueInfo_UNSTABLE(): RecoilValue<T> => AtomInfo<T>;

interface AtomInfo<T> {
  loadable?: Loadable<T>;
  isActive: boolean;
  isSet: boolean;
  isModified: boolean; // [TODO] 수정된 selectors에 대해서도 표시할 수 있도록 해야한다. 현재는 atom의 수정 여부만 표기된다.
  type: 'atom' | 'selector' | undefined; // 일단 지금은, 초기화될 때까지는 undefined를 지닌다.
  deps: Iterable<RecoilValue<T>>;
  subscribers: {
    nodes: Iterable<RecoilValue<T>>,
    components: Iterable<ComponentInfo>,
  };
}

interface ComponentInfo {
  name: string;
}
```


이 훅은 `RecoilValue<T>`를 전달받아 해당 atom/selector의 현재 정보가 포함된 객체를 반환하는 함수를 제공한다. 이 훅은 상태를 변화시키거나 새로운 구독을 만들지 않으며, 주로 디버깅 또는 개발 도구에 사용된다.

디버그 정보에 대한 내용은 발전 중에 있지만, 다음 요소들은 아마 포함될 것이다:
* `loadable` - 현재 상태를 지닌 하나의 Loadable 객체. `getLoadable()` 메소드와는 다르게 이 메소드는 스냅샷(snapshot)을 전혀 변형시키기 않는다. 단순히 현재 상태를 제공하며, 새로운 atoms/selectors를 초기화하거나, 새로운 selector 평가를 수행하거나, 종속성 또는 구독을 업데이트하진 않는다. 
* `isSet` - 스냅샷 상태(snapshot state)에 저장된 명확한 값을 가진 atom인 경우 True, selector이거나 default atom 상태를 사용하는 경우 False
* `isModified` - 마지막 트랜잭션 이후 수정된 atom인 경우 True
* `type` - `atom` 또는 `selector` 중 하나
* `deps` - 이 노드가 의존하고 있는 atoms 혹은 selectors를 담은 iterator 객체
* `subscribers` - 이 스냅샷 내에서 어떤 항목들이 이 노드를 구독하고있는 지에 대한 정보. 자세한 사항은 개발중이다.

### 예시

```jsx
function ButtonToShowCurrentSubscriptions() {
  const getRecoilValueInfo = useGetRecoilValueInfo_UNSTABLE();
  function onClick() {
    const {subscribers} = getRecoilValueInfo(myAtom);
    console.debug(
      'Current Subscriber Nodes:',
      Array.from(subscribers.nodes).map(({key})=>key),
    );
  }

  return <button onClick={onClick} >See Current Subscribers</button>;
}
```
