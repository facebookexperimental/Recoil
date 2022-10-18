---
title: Recoil Sync Library
sidebar_label: 소개
---

[`recoil-sync`](https://www.npmjs.com/package/recoil-sync) NPM 패키지는 Recoil 상태를 외부 시스템과 동기화하는데 도움이되는 애드온 라이브러리를 제공합니다.  간단한 [비동기 데이터 쿼리](/docs/guides/asynchronous-data-queries)는 selectors 또는 `useEffect()`를 통해 구현할 수 있고, [atom effects](/docs/guides/atom-effects)는 개별 atoms의 양방향 동기화에 사용할 수 있습니다.  `recoil-sync` 애드온 패키지는 몇 가지 추가 기능을 제공합니다:

* **Atomic 트랜잭션 일괄 처리** - 여러 atoms에 대한 업데이트를 외부 시스템과 단일 트랜잭션으로 함께 일괄 처리할 수 있습니다.  이것은 관련 atoms의 일관된 상태를 위해 atomic 트랜잭션이 필요한 경우 중요할 수 있습니다.
* **추상적이고 유연함** - 이 API를 사용하면 동기화 방법에 대한 설명과 별도로 동기화할 atoms를 지정할 수 있습니다.  이를 통해 컴포넌트는 구현을 변경하지 않고도 atoms를 사용하고 다른 환경의 다른 시스템과 동기화할 수 있습니다.  예를 들어, 컴포넌트는 stand-alone tool에서 사용될 때 URL에 지속되는 atoms를 사용할 수 있고 다른 도구에 내장될 때 사용자 정의 데이터베이스에 지속되는 atoms를 사용할 수 있습니다.
* **유효성 검사 및 이전 버전과의 호환성** - 외부 소스의 상태를 처리할 때 입력의 유효성을 검사하는 것이 중요합니다.  상태가 앱의 수명 이후에도 지속되는 경우 이전 버전의 상태와의 하위 호환성을 고려하는 것도 중요할 수 있습니다.  `recoil-sync` 와 [`refine`](/docs/refine/introduction)은 이 기능을 제공하는 데 도움이 됩니다.
* **외부 저장소에 대한 Atoms의 복잡한 매핑** - atoms와 외부 저장소 항목 간에 일대일 매핑이 없을 수 있습니다.  Atoms는 최신 버전의 항목을 사용하기 위해 마이그레이션할 수 있고, 여러 항목에서 props를 가져오거나, 일부 복합 상태 또는 기타 복잡한 매핑을 가져올 수 있습니다.
* **React Hooks 또는 Props와 동기화** - 이 라이브러리를 사용하면 atom effects에서 액세스할 수 없는 React hooks 또는 props와 atoms를 동기화할 수 있습니다.

`recoil-sync` 라이브러리는 [syncing with the browser URL](/docs/recoil-sync/url-persistence)과 같은 외부 저장소에 대한 내장 구현도 제공합니다.

---

기본 아이디어는 동기화하려는 각 atom에 [`syncEffect()`](/docs/recoil-sync/sync-effect) 추가한 다음 `<RecoilRoot>` 내부에 [`<RecoilSync>`](/docs/recoil-sync/api/RecoilSync) 를 추가하여 해당 atoms를 동기화하는 방법을 지정하는 것입니다.  [`<RecoilURLSyncJSON>`](/docs/recoil-sync/url-persistence)과 같은 내장 저장소를 사용하거나, [직접 만들거나](/docs/recoil-sync/implement-store), 또는 다른 저장소와 다른 atoms 그룹을 동기화할 수도 있습니다.

## Example

### URL 지속성

다음은 [브라우저 URL과 atom을 동기화](/docs/recoil-sync/url-persistence)하는 간단한 예 입니다:

```jsx
const currentUserState = atom<number>({
  key: 'CurrentUser',
  default: 0,
  effects: [
    syncEffect({ refine: number() }),
  ],
});
```

그런 다음 애플리케이션의 루트에서, 태그가 지정된 모든 atoms를 URL과 동기화하기 위해 [`<RecoilURLSyncJSON>`](/docs/recoil-sync/api/RecoilURLSyncJSON)만 포함하면 됩니다.

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <RecoilURLSyncJSON location={{part: 'queryParams'}}>
        ...
      </RecoilURLSyncJSON>
    </RecoilRoot>
  )
}
```

이제 이 atom은 초기 로드 동안 URL을 기반으로 상태를 초기화하고 모든 상태 변형은 URL을 업데이트하고 URL의 변경 사항(예: 뒤로 가기 버튼)은 atom을 업데이트합니다.  [Sync Effect](/docs/recoil-sync/sync-effect), [Store Implementation](/docs/recoil-sync/implement-store) 및 [URL Persistence](/docs/recoil-sync/url-persistence) 가이드 에서 더 많은 예를 참조하세요.

## Installation

[Recoil 설치 가이드](/docs/introduction/installation) 를 참조하고 추가 종속성으로 [`recoil-sync`](https://www.npmjs.com/package/recoil-sync) 를 추가합니다.

`recoil-sync`는 유형 세분화 및 입력 유효성 검사를 위해 [`refine`](/docs/refine/introduction) 라이브러리를 사용합니다.
