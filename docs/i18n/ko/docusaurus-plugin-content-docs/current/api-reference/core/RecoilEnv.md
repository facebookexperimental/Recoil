---
title: RecoilEnv
sidebar_label: RecoilEnv
---

`RecoilEnv`는 읽거나 쓸 수 있는 Recoil 환경 변수들을 포함하는 객체입니다.

* **`RECOIL_DUPLICATE_ATOM_KEY_CHECKING_ENABLED`**: `boolean` - 모듈이 정상적으로 reload될 수 있는 NextJS 또는 React의 Fast Refresh를 사용하는 환경에서 중복된 atom/selector key 검사를 비활성화 할 때 유용합니다. 이 설정은 정당한 에러를 포함한 모든 검사를 비활성화하므로, 주의하여 사용하세요.
* **`RECOIL_GKS_ENABLED`**: `Set<string>` - Recoil은 gatekeepers(GKs)라고 불리는 동작을 변경하는 불안정한 내부 플래그들의 집합을 갖습니다. 이 플래그들은 테스트, 개선, 안정화를 거쳐 점진적으로 Recoil 정기 릴리즈에 반영되었습니다. 이 변수를 통해 추가적인 플래그들에 접근하여 새로운 실험적인 기능들을 시도할 수 있습니다.

  GK를 활성화하려면 첫 번째 `<RecoilRoot>`를 _생성하기 전에_ 집합에 추가해야 합니다:
  ```jsx
  RecoilEnv.RECOIL_GKS_ENABLED.add('recoil_transition_support');
  ```

  사용 가능한 플래그 목록 일부:
  * `recoil_hamt_2020` (기본적으로 활성화됨) - `Map<K, V>` 구현을 [hash array mapped trie](https://en.wikipedia.org/wiki/Hash_array_mapped_trie)로 변경
  * `recoil_sync_external_store` (기본적으로 활성화됨) - 사용중인 버전의 React에서 [`useSyncExternalStore`](https://reactjs.org/docs/hooks-reference.html#usesyncexternalstore)를 제공한다면 이에 대한 지원을 활성화함
  * `recoil_suppress_rerender_in_callback` (기본적으로 활성화됨) - 레퍼런스 동치로 비교했을 때 selector의 값이 변경되지 않았다면 컴포넌트의 리렌더링을 방지함
  * `recoil_memory_managament_2020` (기본적으로 활성화됨) - atom과 selector의 컨텐츠가 어떠한 컴포넌트에서도 사용되지 않는다면 자동으로 메모리에서 해제하여 가비지 컬렉션을 수행함
  * `recoil_transition_support` - [`useTransition`](https://reactjs.org/docs/hooks-reference.html#usetransition) 지원을 활성화함; `recoil_sync_external_store`보다 우선하여 적용됨

## NodeJS

NextJS와 같은 NodeJS 환경에서도 `precess.env` 설정을 통해 환경 변수를 초기화할 수 있습니다. `process.env`를 통해 설정된 변수는 데이터 타입에 따라 아래와 같이 파싱됩니다:

* `boolean` - `true` 또는 `false`, 대소문자 구분하지 않음
* `Set<string>` - 공백 또는 콤마로 분리된, 집합에 추가되는 문자열 목록, 예: `a b c` 또는 `a,b,c` (현재 전체 집합을 덮어쓰는 것은 불가능함)

---
