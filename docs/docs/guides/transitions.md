---
title: React 18 Transitions
sidebar_label: Transitions
---

[React 18](https://react.dev/blog/2021/06/08/the-plan-for-react-18) offers a new hook [**`useTransition()`**](https://react.dev/reference/react/useTransition) for transitioning to a new state while having control over what to render before the new state is ready. Recoil should be compatible with this approach and provides a consistent view with React state. However, React 18 may fallback from concurrent updates and does not yet officially support initiating transitions based on state changes to external stores. This is something the React team is looking into supporting, but until then we have added experimental support for this through the following hooks; other hooks should already fully support transitions, so only these variants are necessary. This API is considered experimental because there may be use cases we haven’t found which are not handled.

- **`useRecoilState_TRANSITION_SUPPORT_UNSTABLE()`**
- **`useRecoilValue_TRANSITION_SUPPORT_UNSTABLE()`**
- **`useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE()`**

Here's an example that displays the current results of a query while a new result is loading:

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
