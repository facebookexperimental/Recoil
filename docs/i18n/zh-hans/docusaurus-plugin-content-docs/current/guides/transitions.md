---
title: React 18 Transitions
sidebar_label: Transitions
---

[React 18](https://reactjs.org/blog/2021/06/08/the-plan-for-react-18.html) 提供了一个新的[**`useTransition()`**](https://reactjs.org/docs/react-api.html#transitions)hook，用于在新状态准备好之前控制渲染内容的过渡。Recoil应该与这种方法兼容，并提供与React状态一致的视图。然而，React 18可能会从并发更新回退，并且还不支持基于状态更改向外部存储发起过渡的官方支持。这是React团队正在考虑支持的事项，但在此之前，我们通过以下hook添加了实验性支持；其他hook应已完全支持过渡，因此只需要这些变体。此API被认为是实验性的，因为可能存在我们尚未发现的未处理的用例。

* **`useRecoilState_TRANSITION_SUPPORT_UNSTABLE()`**
* **`useRecoilValue_TRANSITION_SUPPORT_UNSTABLE()`**
* **`useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE()`**

这是一个示例，显示了在加载新结果时当前查询的结果：
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
