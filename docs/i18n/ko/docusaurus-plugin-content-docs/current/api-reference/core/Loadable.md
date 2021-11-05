---
title: class Loadable
sidebar_label: Loadable
---

`Loadable` 객체는 Recoil [atom](/docs/api-reference/core/atom) 혹은 [selector](/docs/api-reference/core/selector)의 최신 상태를 대표합니다. 이 상태는 사용가능한 값을 가지고 있거나 에러 상태이거나 혹은 여전히 비동기 해결 보류 중일 수 있습니다. `Loadable` 은 다음의 인터페이스를 가집니다.

- `state`: atom 혹은 selector의 최신 상태입니다. 가능한 값은 '`hasValue`', '`hasError`', 혹은 '`loading`' 입니다.
- `contents`: `Loadable`에 의해서 대표되는 값입니다. 만약 상태가 `hasValue` 라면, 이는 실제 값입니다. 만약 상태가 `hasError` 라면 이는 던져진 Error 객체입니다. 그리고 만약 상태가 'loading'이라면 `toPromise()`를 사용하여 값의 `Promise`를 얻을 수 있습니다.

Loadable은 최신 상태에 접근하기 위한 도우미 메서드를 가지고 있습니다. *이 API는 아직 불안정합니다:*

- `getValue()` - React Suspense와 Recoil selectors의 시맨틱에 매치되는 값에 접근하기 위한 메서드. 만약 상태가 값을 가지고 있다면 값을 리턴하며, error를 가지고 있다면 해당 error를 던집니다. 만약 여전히 보류중이라면 실행을 연기하거나 보류중인 상태를 전파하기 위해 리렌더링합니다.
- `toPromise()`: selector가 resolve되면 resolve될 `Promise` 를 리턴합니다. selector가 동기이거나 이미 resolve된 상태라면, 즉시 resolve 되는 `Promise` 를 리턴합니다.
- `valueMaybe()` - 가능하다면 값을 리턴하며 다른 경우에는 `undefined` 를 리턴합니다.
- `valueOrThrow()` - 가능하다면 값을 리턴하거나 Error를 던집니다.
- `map()` - Loadable의 값을 변형하기 위한 함수를 받으며 새로운 Loadable을 변형된 값과 함께 리턴합니다. 변형 함수는 값의 매개변수를 받아 새로운 값을 리턴합니다. 던져진 에러나 suspense를 전파할 수도 있습니다.

### Example

```jsx
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
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

