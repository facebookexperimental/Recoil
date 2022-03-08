---
title: useRecoilRefresher_UNSTABLE(state)
sidebar_label: useRecoilRefresher()
---

`useRecoilRefresher_UNSTABLE()` 훅은 연관된 모든 캐시를 삭제하고 selector를 호출할 수 있는 콜백을 반환합니다. selector가 비동기 요청을 하면 재평가하고 새롭게 요청을 합니다. 예를 들어, 최신 데이터로 업데이트하거나 오류가 나서 다시 시도하는 경우에 유용합니다.(참조 [Asynchronous Data Queries Guide](/docs/guides/asynchronous-data-queries#query-refresh))



[`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback) 이나 selector의 [`getCallback()`](/docs/api-reference/core/selector#returning-objects-with-callbacks)를 사용해 캐시를 새로 고칠 수도 있습니다.

---

```jsx
type Refresher = () => void;

function useRecoilRefresher_UNSTABLE(state: RecoilValue): Refresher
```

atom은 새로고침되지 않으며, 현재 상태를 유지합니다. selectors는 캐쉬를 지웁니다. selector는 주로 추상화로 사용하기 때문에 selector를 새로 고치면 연관된 모든 selector의 캐시가 재귀적으로 새로 고쳐집니다. 


### Example

```jsx
const myQuery = selector({
  key: 'MyQuery',
  get: () => fetch(myQueryURL),
});

function MyComponent() {
  const data = useRecoilValue(myQuery);
  const refresh = useRecoilRefresher_UNSTABLE(myQuery);

  return (
    <div>
      Data: {data}
      <button onClick={() => refresh()}>Refresh</button>
    </div>
  );
}
```
