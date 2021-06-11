---
title: 비동기 데이터 쿼리
sidebar_label: 비동기 데이터 쿼리
---

Recoil은 데이터 플로우 그래프를 통해 상태를 매핑하는 방법과 파생된 상태를 리액트 컴포넌트에 제공합니다. 가장 강력한 점은 graph에 속한 함수들도 비동기가 될 수 있다는 것입니다. 이는 비동기 함수들을 동기 리액트 컴포넌트 렌더 함수에서 사용하기 쉽게 해줍니다. Recoil은 동기와 비동기 함수들을 selector의 데이터 플로우 그래프에서 균일하게 혼합하게 해줍니다. Selector `get`콜백에서 나온 값 그 자체 대신 프로미스를 리턴하면 인터페이스는 정확하게 그대로 유지됩니다. 이들은 Selector일 뿐이므로 다른 selector들에 의존하여 데이터를 추가로 변환 할 수도 있습니다.

Selector는 비동기 데이터를 Recoil의 데이터 플로우 그래프로 포함하는 방법 중 하나로 사용될 수 있습니다. Selector는 "idempotent" 함수를 대표한다는 것을 숙지하고 있어야합니다: 주어진 인풋들로 항상 같은 결과를 만들어냅니다.(적어도 애플리케이션의 생명주기동안은 말이죠). 이것은 selector 평가가 캐시되거나, 재시작되거나, 혹은 수차례에 걸쳐서 실행될 수 있으므로 중요합니다. selector가 보통 읽기 전용 DB 쿼리를 모델링하는데에 좋은 방법이라고 하는 이유도 이 때문입니다. 변경 가능한 데이터의 경우, [Query Refresh](https://recoiljs.org/docs/guides/asynchronous-data-queries#query-refresh)를 사용하거나 변경가능한 상태를 동기화하거나 상태를 유지하거나 혹은 다른 부수효과에 대해서 실험적인 [Atom Effects](https://recoiljs.org/docs/guides/atom-effects) API를 생각해볼수도 있습니다.

## Synchronous Example (동기 예제)

여기 user 이름을 얻기위한 간단한 동기 atom 과 selector를 예로 들어보겠습니다.

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: 1,
});

const currentUserNameState = selector({
  key: 'CurrentUserName',
  get: ({get}) => {
    return tableOfUsers[get(currentUserIDState)].name;
  },
});

function CurrentUserInfo() {
  const userName = useRecoilValue(currentUserNameState);
  return <div>{userName}</div>;
}

function MyApp() {
  return (
    <RecoilRoot>
      <CurrentUserInfo />
    </RecoilRoot>
  );
}
```

## Asynchronous Example (비동기 예제)

만약 user의 이름이 쿼리 해야하는 데이터베이스에 저장되어 있었다면, `Promise`를 리턴하거나 혹은 `async` 함수를 사용하기만 하면 됩니다. 의존성에 하나라도 변경점이 생긴다면, selector는 새로운 쿼리를 재평가하고 다시 실행시킬겁니다. 그리고 결과는 쿼리가 유니크한 인풋이 있을 때에만 실행되도록 캐시됩니다.

```jsx
const currentUserNameQuery = selector({
  key: 'CurrentUserName',
  get: async ({get}) => {
    const response = await myDBQuery({
      userID: get(currentUserIDState),
    });
    return response.name;
  },
});

function CurrentUserInfo() {
  const userName = useRecoilValue(currentUserNameQuery);
  return <div>{userName}</div>;
}
```

Selector의 인터페이스는 동일하므로 컴포넌트에서는 selector를 사용하면서 동기 atom 상태나 파생된 selector 상태, 혹은 비동기 쿼리를 지원하는지 신경쓰지 않아도 괜찮습니다!

하지만, React 렌더 함수가 동기인데 promise가 resolve 되기 전에 무엇을 렌더 할 수 있을까요? Recoil은 보류중인 데이터를 다루기 위해 [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html)와 함께 동작하도록 디자인되어 있습니다. 컴포넌트를 Suspense의 경계로 감싸는 것으로 아직 보류중인 하위 항목들을 잡아내고 대체하기 위한 UI를 렌더합니다.

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <React.Suspense fallback={<div>Loading...</div>}>
        <CurrentUserInfo />
      </React.Suspense>
    </RecoilRoot>
  );
}
```

## Error Handling (에러 처리하기)

만약 요청에 에러가 있다면 어떻게 해야 할까요? Recoil selector는 컴포넌트에서 특정 값을 사용하려고 할 때에 어떤 에러가 생길지에 대한 에러를 던질 수 있습니다. 이는 React [`<ErrorBoundary>`](https://reactjs.org/docs/error-boundaries.html)로 잡을 수 있습니다. 예를 들자면:

```jsx
const currentUserNameQuery = selector({
  key: 'CurrentUserName',
  get: async ({get}) => {
    const response = await myDBQuery({
      userID: get(currentUserIDState),
    });
    if (response.error) {
      throw response.error;
    }
    return response.name;
  },
});

function CurrentUserInfo() {
  const userName = useRecoilValue(currentUserNameQuery);
  return <div>{userName}</div>;
}

function MyApp() {
  return (
    <RecoilRoot>
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Queries with Parameters (매개변수가 있는 쿼리)

가끔 파생된 상태만이 아닌 매개변수를 기반으로 쿼리를 하고싶을 때가 있을 수 있습니다. 예를 들어 컴포넌트 props를 기반으로 쿼리를 하고 싶다고 해봅시다. 이 때 [**`selectorFamily`**](/docs/api-reference/utils/selectorFamily) helper를 사용할 수 있습니다:

```jsx
const userNameQuery = selectorFamily({
  key: 'UserName',
  get: (userID) => async () => {
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response.name;
  },
});

function UserInfo({userID}) {
  const userName = useRecoilValue(userNameQuery(userID));
  return <div>{userName}</div>;
}

function MyApp() {
  return (
    <RecoilRoot>
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <UserInfo userID={1} />
          <UserInfo userID={2} />
          <UserInfo userID={3} />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Data-Flow Graph

쿼리를 selector로 모델링하면 상태와 파생된 상태, 그리고 쿼리를 혼합한 데이터 플로우 그래프를 만들 수 있습니다! 이 그래프는 상태가 업데이트 되면 리액트 컴포넌트를 업데이트하고 리렌더링합니다.

다음 예시는 최근 유저의 이름과 그들의 친구 리스트를 렌더합니다. 만약 친구의 이름이 클릭되며, 그 이름이 최근 유저가 되며 이름과 리스트는 자동적으로 업데이트 될겁니다.

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: null,
});

const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: (userID) => async () => {
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response;
  },
});

const currentUserInfoQuery = selector({
  key: 'CurrentUserInfoQuery',
  get: ({get}) => get(userInfoQuery(get(currentUserIDState))),
});

const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    return friendList.map((friendID) => get(userInfoQuery(friendID)));
  },
});

function CurrentUserInfo() {
  const currentUser = useRecoilValue(currentUserInfoQuery);
  const friends = useRecoilValue(friendsInfoQuery);
  const setCurrentUserID = useSetRecoilState(currentUserIDState);
  return (
    <div>
      <h1>{currentUser.name}</h1>
      <ul>
        {friends.map((friend) => (
          <li key={friend.id} onClick={() => setCurrentUserID(friend.id)}>
            {friend.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MyApp() {
  return (
    <RecoilRoot>
      <ErrorBoundary>
        <React.Suspense fallback={<div>Loading...</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Concurrent Requests (동시 요청)

위의 예시에서 눈치채셨는지 모르겠지만, `friendsInfoQuery` 는 쿼리를 이용하여 각 친구에 대한 자료를 받아옵니다. 하지만 이를 루프하는 것으로 기본적으로 직렬화됩니다. 검색이 빠르다면 그것도 괜찮습니다. 자원을 많이 사용한다면 [`waitForAll`](https://recoiljs.org/docs/api-reference/utils/waitForAll/)과 같은 concurrent helper를 사용하여 병렬로 돌릴 수 있습니다. 이 helper는 배열과 의존성이 담긴 네임드 객체를 허용합니다.

```jsx
const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    const friends = get(
      waitForAll(friendList.map((friendID) => userInfoQuery(friendID))),
    );
    return friends;
  },
});
```

[`waitForNone`](/docs/api-reference/utils/waitForNone)을 사용하여 일부 데이터로 추가적인 UI 업데이트를 할 수 있습니다.

```jsx
const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    const friendLoadables = get(
      waitForNone(friendList.map((friendID) => userInfoQuery(friendID))),
    );
    return friendLoadables
      .filter(({state}) => state === 'hasValue')
      .map(({contents}) => contents);
  },
});
```

## Pre-Fetching (미리 가져오기)

성능 문제로 렌더링 이전에 받아오기를 시작하고 싶을 수 있습니다. 그 방법은 렌더링을 하면서 쿼리를 진행할 수 있습니다. React docs에서 몇 가지 예시를 찾을 수 있습니다. 이 패턴은 Recoil에서도 동작합니다.

위의 예시를 바꿔 사용자가 유저계정을 바꾸기 위해서 버튼을 누르자마자 다음 유저 정보를 받아오기 시작하는 형태로 만들어봅시다.

```jsx
function CurrentUserInfo() {
  const currentUser = useRecoilValue(currentUserInfoQuery);
  const friends = useRecoilValue(friendsInfoQuery);

  const changeUser = useRecoilCallback(({snapshot, set}) => (userID) => {
    snapshot.getLoadable(userInfoQuery(userID)); // pre-fetch user info
    set(currentUserIDState, userID); // change current user to start new render
  });

  return (
    <div>
      <h1>{currentUser.name}</h1>
      <ul>
        {friends.map((friend) => (
          <li key={friend.id} onClick={() => changeUser(friend.id)}>
            {friend.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Query Default Atom Values (기본 Atom 값 쿼리)

Atom을 사용하여 변경 가능한 로컬 상태를 나타내지만, seledtor를 사용하여 기본값을 쿼리하는 것이 일반적인 패턴입니다:

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: selector({
    key: 'CurrentUserID/Default',
    get: () => myFetchCurrentUserID(),
  }),
});
```

만약 양방향 데이터 동기화를 원한다면 [atom effects](https://recoiljs.org/docs/guides/atom-effects)를 고려해보는 것도 좋습니다.

## Async Queries Without React Suspense (React Suspense를 사용하지 않은 비동기 쿼리)

보류중인 비동기 selector를 다루기 위해서 React Suspense를 사용하는 것이 필수는 아닙니다. [`useRecoilValueLoadable()`](https://recoiljs.org/docs/api-reference/core/useRecoilValueLoadable) hook을 사용하여 렌더링 중 상태(status)를 확인할 수도 있습니다.

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

## Query Refresh (쿼리 새로고침)

selector를 사용하여 데이터 쿼리를 모델링 할 때, selector 평가가 항상 주어진 상태에 대해서 일관적인 값을 제공해야 한다는 것을 기억해야 합니다. Selector는 다른 atom과 selector 상태들에서 파생되는 상태들을 대표합니다. 그러므로 selector 평가 함수들은 주어진 인풋에 관해서 여러번 캐시되고 실행되더라도 idempotent(멱등)해야 합니다. 실제로 단일 selector는 어플리케이션의 생명주기 동안 결과과 다양하게 나올거라 예상하는 쿼리에 사용되면 안됨을 의미합니다.

변경가능한 데이터를 다루기위해서 몇 가지 패턴을 사용할 수 있습니다.

### Use a Request ID (요청 ID 사용하기)

Selector 평가는 인풋을 바탕으로 주어진 상태에 일관된 값을 제공해야합니다(종속된 상태, 혹은 패밀리 매개변수). 따라서 요청 ID를 패밀리 매개변수 혹은 쿼리에 대한 종속성으로 추가할 수 있습니다. 예를 들면 다음과 같습니다:

```jsx
const userInfoQueryRequestIDState = atomFamily({
  key: 'UserInfoQueryRequestID',
  default: 0,
});

const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: (userID) => async ({get}) => {
    get(userInfoQueryRequestIDState(userID)); // Add request ID as a dependency
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response;
  },
});

function useRefreshUserInfo(userID) {
  setUserInfoQueryRequestID = useSetRecoilState(
    userInfoQueryRequestIDState(userID),
  );
  return () => {
    setUserInfoQueryRequestID((requestID) => requestID + 1);
  };
}

function CurrentUserInfo() {
  const currentUserID = useRecoilValue(currentUserIDState);
  const currentUserInfo = useRecoilValue(userInfoQuery(currentUserID));
  const refreshUserInfo = useRefreshUserInfo(currentUserID);

  return (
    <div>
      <h1>{currentUser.name}</h1>
      <button onClick={refreshUserInfo}>Refresh</button>
    </div>
  );
}
```

### Use an Atom (Atom 사용하기)

또 다른 방법은 selector 대신 atom을 사용하여 쿼리 결과를 모델링하는 것입니다. Atom 상태를 새로운 쿼리 결과를 독자적인 새로고침 방침에 맞추어 명령적으로(imperatively) 업데이트 할 수 있습니다.

```jsx
const userInfoState = atomFamily({
  key: 'UserInfo',
  default: (userID) => fetch(userInfoURL(userID)),
});

// React component to refresh query
function RefreshUserInfo({userID}) {
  const refreshUserInfo = useRecoilCallback(
    ({set}) => async (id) => {
      const userInfo = await myDBQuery({userID});
      set(userInfoState(userID), userInfo);
    },
    [userID],
  );

  // Refresh user info every second
  useEffect(() => {
    const intervalID = setInterval(refreshUserInfo, 1000);
    return () => clearInterval(intervalID);
  }, [refreshUserInfo]);

  return null;
}
```

이 접근 방법에는 한가지 단점이 있습니다. Atom이 현재 원하는 동작일 경우, 쿼리 새로고침이 보류중인 동안 React Suspense를 자동적으로 활용하기 위해서 Promise를 새 값으로 받아들이는 것을 지원하지 않는다는 점입니다. 그러나 원한다면 로딩 상태와 결과를 수동으로 인코딩 하는 객체를 저장할 수 있습니다.

Atom의 쿼리 동기화를 위해서 [atom effects](https://recoiljs.org/docs/guides/atom-effects)도 고려해볼 수 있습니다.
