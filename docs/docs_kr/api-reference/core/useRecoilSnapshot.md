---
title: useRecoilSnapshot()
sidebar_label: useRecoilSnapshot()
---

이 hook은 렌더링 중에 동기적으로 [`Snapshot`](/docs/api-reference/core/Snapshot) 객체를 리턴하고 모든 Recoil 상태 변화에 대해 호출 컴포넌트를 구독합니다. 이 hook을 디버깅 툴로 사용하고 싶을 수도, 초기 렌더링을 하는 동안 동기적으로 상태를 가져야 하는 곳에 서버 사이드 렌더링을 위해서 사용하고 싶을 수도 있습니다.

```jsx
function useRecoilSnapshot(): Snapshot
```

이 hook은 *모든* Recoil 상태의 변화에 대해서 컴포넌트에게 리렌더링을 일으키므로 사용에 주의해야 합니다. 향후에는 성능에 대한 debounce하는 기술을 제공하려 합니다.

### Link Example
 변형이 적용된 현재 상태를 바탕으로 `href`로 `<a>` 앵커를 렌더링하는 `<LinkToNewView>` 컴포넌트를 정의합니다. 이 예제에서 `uriFromSnapshot()`은 페이지가 로딩 될 때에 복원될 수 있는 URI의 현재 상태를 인코딩하는 사용자 정의 함수입니다.

```jsx
function LinkToNewView() {
  const snapshot = useRecoilSnapshot();
  const newSnapshot = snapshot.map(({set}) => set(viewState, 'New View'));
  return <a href={uriFromSnapshot(newSnapshot)}>Click Me!</a>;
}
```

이 예제는 단순화 된 예제입니다. 더 확장이 가능하고 최적화 된 브라우저 히스토리 지속성 라이브러리에서 링크를 생성하기 위해 이와 같은 helper를 제공합니다. 예를 들어, 브라우저 히스토리를 대체하는 로컬 상태를 업데이트 하기 위해 클릭 핸들러를 하이재킹(가로채기)합니다.
