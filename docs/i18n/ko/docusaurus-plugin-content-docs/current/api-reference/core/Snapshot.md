---
title: class Snapshot
sidebar_label: Snapshot
---

Snapshot 객체는 Recoil [atom](/docs/api-reference/core/atom)의 상태의 변경불가능한 스냅샷을 나타냅니다. 전역 Recoil 상태를 관찰, 검사, 관리하기 위한 API를 표준화 하기 위한 것입니다. 이는 개발툴, 전역 상태 동기화, 히스토리 탐색 등에 유용합니다.

```jsx
class Snapshot {
  // Accessors to inspect snapshot state
  getLoadable: <T>(RecoilValue<T>) => Loadable<T>;
  getPromise: <T>(RecoilValue<T>) => Promise<T>;

  // API to transform snapshots for transactions
  map: (MutableSnapshot => void) => Snapshot;
  asyncMap: (MutableSnapshot => Promise<void>) => Promise<Snapshot>;

  // Developer Tools API
  getID: () => SnapshotID;
  getNodes_UNSTABLE: ({
    isModified?: boolean,
  } | void) => Iterable<RecoilValue<mixed>>;
  getInfo_UNSTABLE: <T>(RecoilValue<T>) => {...};
}

function snapshot_UNSTABLE(initializeState?: (MutableSnapshot => void)): Snapshot
```

## Obtaining Snapshots

### Hooks

Recoil은 다음의 hook을 현재의 상태를 기반으로 스냅샷을 얻기 위해 제공합니다:

- [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) - 스냅샷에 비동기 엑세스
- [`useRecoilSnapshot()`](/docs/api-reference/core/useRecoilSnapshot) - 스냅샷에 동기 엑세스
- [`useRecoilTransactionObserver_UNSTABLE()`](/docs/api-reference/core/useRecoilTransactionObserver) - 모든 상태 변경에 대해서 Snapshot을 구독

### Building a Snapshot

선택적 초기화 함수를 허용하는 `snapshot_UNSTABLE()` 팩토리를 사용하여 새로운 스냅샷을 빌드 할 수도 있습니다. 이는 React context 외부의 selector의 [테스트](/docs/guides/testing)와 평가에 사용될 수 있습니다.

## Reading Snapshots

스냅샷은 atom 상태에 관련하여 읽기 전용입니다. 이들은 atom 상태를 읽고 selector의 파생된 상태를 평가하기 위해서 사용될 수 있습니다. `getLoadable()`은 이 스냅샷의 atom 혹은 selector의 상태와 함께 [Loadable](/docs/api-reference/core/Loadable)을 제공합니다. `getPromise()` 메서드는 정적 atom 상태를 기반으로 하는 값을 확인 하기 위해 비동기 selector의 평가된 값을 대기하기 위해 사용될 수 있습니다.

### Example

```jsx
function MyComponent() {
  const logState = useRecoilCallback(({snapshot}) => () => {
    console.log("State: ", snapshot.getLoadable(myAtom).contents);

    const newSnapshot = snapshot.map(({set}) => set(myAtom, 42));
  });
}
```

## Transforming Snapshots

스냅샷을 변경하고 싶은 경우가 있을 수 있습니다. 스냅샷은 변경이 불가능하지만 변환 집합을 사용하여 새로운 변경불가능한 스냅샷으로 스냅샷 자신을 매핑하는 방법이 있습니다. 매핑 메서드는 콜백을 통해 변경되며 궁극적으로 매핑 작업에서 리턴되는 새로운 스냅샷이 될 MutableSnapshot을 전달받은 콜백을 받습니다.

```jsx
class MutableSnapshot {
  set: <T>(RecoilState<T>, T | DefaultValue | (T => T | DefaultValue)) => void;
  reset: <T>(RecoilState<T>) => void;
}
```

`set()` 과 `reset()`은 쓰기 가능한 selector의 set 프로퍼티에 제공된 콜백과 같은 시그니처를 가집니다. 하지만 현재 상태가 아닌 새로운 스냅샷에만 영향을 줍니다.

## Going to a Snapshot

다음의 hook은 현재 Recoil 상태를 제공된 `Snapshot`으로 네비게이트 할 수 있습니다:
- [`useGotoRecoilSnapshot()`](/docs/api-reference/core/useGotoRecoilSnapshot) - 현재의 상태를 Snapshot에 일치하게 업데이트


## Developer Tools

Snapshots provide some methods useful for [building developer tools](/docs/guides/dev-tools) or debugging capabilities with Recoil.  This API is still evolving, and thus marked as `_UNSTABLE`, as we work on the initial dev tools.

### Snapshot IDs

커밋된 각각의 상태 혹은 변경된 스냅샷은 `getID()`를 통해 얻을 수 있는 고유한 불투명 버전의 ID를 갖습니다. 이는 `useGotoRecoilSnapshot()`을 통해 이전 스냅샷으로 돌아갔을 때 이를 감지하기 위해서 사용할 수 있습니다.

### Enumerate Atoms and Selectors

`getNodes_UNSTABLE()` 메서드는 이 스냅샷에서 사용된 모든 atom과 selector를 나열하는데에 사용할 수 있습니다. Atom, selector, 그리고 families는 언제든 생성될 수 있으나, 실제로 사용되었을 때에만 스냅샷에 나타납니다. Atom과 selector는 더 이상 사용되지 않을 경우 후속 상태 스냅샷에서 제거될 수 있습니다.

선택적 `isModified` 플래그는 마지막 트랜잭션 이후 수정 된 atom만 리턴 할 수 있도록 지정할 수 있습니다.

### Debug information

`getInfo_UNSTABLE()` 메서드는 atom과 selector에 대한 추가적인 디버그 정보를 제공합니다. 디버그 정보 부분은 발전 중이지만 다음을 포함할 수 있습니다:

* `loadable` - 현재 상태의 Loadable. `getLoadable()` 같은 메서드와 다르게 이 메서드는 스냅샷을 전혀 변경하지 않습니다. 현재 상태를 제공하며, 새로운 atom/selector를 초기화하거나 새로운 selector 평가를 수행하거나, 의존성 혹은 구독을 업데이트 하지 않습니다.
* `isSet` - 이것이 스냅샷 상태에 저장된 명시적인 값을 가진 atom이라면 True입니다.
* `isModified` - 마지막 트랜젝션 이후로 수정된 atom이라면 True입니다.
* `type` - `atom` 혹은 `selector`
* `deps` - 이 노드가 의존하는 atom 혹은 selector에 대한 iterator입니다.
* `subscribers` - 이 스냅샷에 대해서 이 노드를 구독하는 항목에 대한 정보입니다. 세부사항은 개발중입니다.

## State Initialization

[`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) 컴포넌트와 `snapshot_UNSTABLE()` 팩토리는 `MutableSnapshot`을 통해 상태를 초기화하기 위한 선택적인 `initializeState` prop을 취합니다. 이는 모든 atom을 미리 알고 있고, 상태가 동기적으로 설정되어야하는 서버사이드렌더링과 호환되는 경우 지속되는 상태를 로딩하는데에 유용할 수 있습니다. atom 별 초기화/지속성 그리고 동적 atom과의 작업의 용이성을 위해 [atom effects](/docs/guides/atom-effects)를 고려해야합니다.

```jsx
function MyApp() {
  function initializeState({set}) {
    set(myAtom, 'foo');
  }

  return (
    <RecoilRoot initializeState={initializeState}>
      ...
    </RecoilRoot>
  );
}
```
