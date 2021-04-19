---
title: useRecoilStateLoadable(state)
sidebar_label: useRecoilStateLoadable()
---

이 hook은 비동기 selector의 값을 읽기 위해서 사용됩니다. 이 hook은 암묵적으로 주어진 상태에 컴포넌트를 구독합니다.

 [`useRecoilState()`](/docs/api-reference/core/useRecoilState)와 다르게 이 hook은 비동기 selector에서 읽어올 때 ([React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html)와 함께 작동하기 위해) Error 혹은 Promise를 던지지 않습니다. 대신 이 hook은 [`Loadable`](/docs/api-reference/core/Loadable) 객체를 setter 콜백과 함께 리턴합니다.

---

```jsx
function useRecoilStateLoadable<T>(state: RecoilState<T>): [Loadable<T>, (T | (T => T)) => void]
```
- `state`: 비동기 작업이 있을 수 있는 `쓰기 가능`한  [`atom`](/docs/api-reference/core/atom) 혹은  [`selector`](/docs/api-reference/core/selector). 리턴된 loadable의 상태(status)는 제공된 상태(state) selector의 상태(status)에 따라 다릅니다. 

인터페이스가 있는 현재 상태 [`Loadable`](/docs/api-reference/core/Loadable)을 리턴합니다:

- `state`: selector의 상태(status)를 나타냅니다. 가능한 값은 '`hasValue`', '`hasError`', '`loading`'입니다.
- `contents`: 이 `Loadable`이 나타내는 값입니다. 만약 상태가 `hasValue`이면 이는 실제 값이며, 만약 상태가 `hasError`라면 이는 던져진 `Error` 객체입니다. 또한 상태가 `loading`이면 값의 `Promise`입니다.

---

### Example

```jsx
function UserInfo({userID}) {
  const [userNameLoadable, setUserName] = useRecoilStateLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}

```

