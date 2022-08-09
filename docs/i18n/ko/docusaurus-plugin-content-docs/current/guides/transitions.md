---
title: React 18 트랜지션
sidebar_label: 트랜지션
---

[React 18](https://reactjs.org/blog/2021/06/08/the-plan-for-react-18.html) 은 상태가 준비되기 전에 렌더링할 대상을 제어하며 새로운 상태로 전환하기 위한 hook,  [**`useTransition()`**](https://reactjs.org/docs/react-api.html#transitions) 을 제공합니다. Recoil은 이 접근 방식과 호환되어야 하며 React의 상태와 일관된 뷰를 제공해야 합니다. 그러나 React 18은 동시 업데이트에서 제외될 수 있으며 아직 외부 스토어의 상태 변경에 따른 트랜지션을 공식적으로 지원하지 않습니다. React 팀은 해당 기능에 대한 지원을 고려하고 있으나, 그 전에도 사용 할 수 있도록 다음과 같은 hook을 통해 이에 대한 실험적인 지원을 추가하였습니다.

이 API는 핸들링 하지 못한 유즈 케이스가 있을 수 있기 때문에 실험적입니다.

* **`useRecoilState_TRANSITION_SUPPORT_UNSTABLE()`**
* **`useRecoilValue_TRANSITION_SUPPORT_UNSTABLE()`**
* **`useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE()`**

다음은 새로운 결과를 로드하는 동안 쿼리의 현재 결과를 표시하는 예시입니다.
```jsx
function QueryResults() {
  const queryParams = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(queryParamsAtom);
  const results = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(myQuerySelector(queryParams));
  return results;
}

function MyApp() {
  const [queryParams, setQueryParams] = useRecoilState_TRANSITION_SUPPORT_UNSTABLE(queryParamsAtom);
  const [inTransition, startTransition] = useTransition();
  return (
    <div>
      {inTransition ? <div>[Loading new results...]</div> : null}

      Results: <React.Suspense><QueryResults /></React.Suspense>

      <button
        onClick={() => {
          startTransition(() => {
            setQueryParams(...new params...);
          });
        }
      >
        Start New Query
      </button>
    </div>
  );
}
```
