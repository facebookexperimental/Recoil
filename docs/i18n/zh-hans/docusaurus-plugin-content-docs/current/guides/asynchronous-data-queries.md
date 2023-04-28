---
title: 异步数据查询
sidebar_label: Asynchronous Data Queries
---

Recoil 提供了一种通过数据流图将状态和派生状态映射到 React 组件方法。其真正强大的是，图中的函数也可以是异步的。这使得在同步 React 组件渲染器中使用异步函数变得更容易。Recoil 允许你在 selector 的数据流图中无缝混合同步和异步函数。不用返回值本身，只需从 selector `get` 回调中返回一个值的 Promise，接口仍然完全相同。因为这些只是 selector，其他 selector 也可以依据它们来进一步转换数据。

selector 可以被用作将异步数据纳入 Recoil 数据流图的一种方式。请记住，selector 是 “幂等” 函数：对于一组给定的输入，它们应该总是产生相同的结果 (至少在应用程序的生命周期内)。这一点很重要，因为 selector 的计算可能被缓存、重启或多次执行。正因为如此，selector 通常是模拟只读数据库查询的好方法。对于易变的数据，你可以使用 [查询刷新](#query-refresh)，或者同步易变状态、持久化状态，或者对于其他的副作用，考虑实验性的 [Atom Effects](/docs/guides/atom-effects) API。

## 同步示例

例如，这里有一个简单的用于获取一个用户名的同步 [atom](/docs/api-reference/core/atom) 和 [selector](/docs/api-reference/core/selector)。

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

## 异步示例

如果用户名被存储在某个我们需要查询的数据库中，我们需要做的就是返回一个 `Promise` 或者使用一个 `async` 函数。如果任何依赖关系发生变化，selector 都将重新计算并执行新的查询。结果会被缓存起来，所以查询将只对每个独特的输入执行一次。

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

selector 的接口总是相同的，所以使用这个 selector 的组件不需要关心它是用同步 atom 状态、派生 selector 状态或者异步查询来实现的！

但是，由于 React 的渲染函数是同步的，在 Promise 解决之前，它将渲染什么？Recoil 的设计配合 [React Suspense](https://react.dev/reference/react/Suspense) 处理待定 (pending) 数据。如果用 Suspense 边界包裹你的组件，会捕捉到任何仍在 pending 中的后代，并渲染一个后备（fallback） UI。

```jsx
function MyApp() {
  return (
    <RecoilRoot>
      <React.Suspense fallback={<div>加载中。。。</div>}>
        <CurrentUserInfo />
      </React.Suspense>
    </RecoilRoot>
  );
}
```

## 报错处理

但如果请求有错误怎么办？Recoil selector 也可以抛出错误，其错误来自一个组件试图使用该值时就会抛出的错误。这可以用 React [`<ErrorBoundary>`](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) 来捕捉。例如：

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
        <React.Suspense fallback={<div>加载中……</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## 带参查询

有时你希望能够基于参数进行查询，而不仅仅是基于派生状态。例如，你可能想根据组件的 props 来查询。你可以使用 [**`selectorFamily`**](/docs/api-reference/utils/selectorFamily) helper 来实现：

```jsx
const userNameQuery = selectorFamily({
  key: 'UserName',
  get: userID => async () => {
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
        <React.Suspense fallback={<div>加载中……</div>}>
          <UserInfo userID={1}/>
          <UserInfo userID={2}/>
          <UserInfo userID={3}/>
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## 数据流图

记住，通过为可做 selector 的查询建模，我们可以建立一个混合状态、派生状态和查询的数据流图！当状态被更新时，该图会自动更新并重新渲染 React 组件。

下面的例子将渲染当前用户的名字和他们的朋友列表。如果一个朋友的名字被点击，他们将成为当前用户，名字和列表将自动更新。

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: null,
});

const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: userID => async () => {
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
    return friendList.map(friendID => get(userInfoQuery(friendID)));
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
        {friends.map(friend =>
          <li key={friend.id} onClick={() => setCurrentUserID(friend.id)}>
            {friend.name}
          </li>
        )}
      </ul>
    </div>
  );
}

function MyApp() {
  return (
    <RecoilRoot>
      <ErrorBoundary>
        <React.Suspense fallback={<div>加载中……</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## 并行请求

如果你注意到了上面的例子，`friendsInfoQuery` 使用一个查询来获得每个朋友的信息。但是，在一个循环中这样做的结果是它们基本上被序列化了。 如果查询的速度很快，这也许是可行的。 但如果它耗时巨大，你可以使用一个并发 helper，如 [`waitForAll`](/docs/api-reference/utils/waitForAll) 来并行执行它们。这个 helper 接受数组和指定的依赖对象。

```jsx
const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    const friends = get(waitForAll(
      friendList.map(friendID => userInfoQuery(friendID))
    ));
    return friends;
  },
});
```

你可以使用带有部分数据的 [`waitForNone`](/docs/api-reference/utils/waitForNone) 来对用户界面进行增量更新。

```jsx
const friendsInfoQuery = selector({
  key: 'FriendsInfoQuery',
  get: ({get}) => {
    const {friendList} = get(currentUserInfoQuery);
    const friendLoadables = get(waitForNone(
      friendList.map(friendID => userInfoQuery(friendID))
    ));
    return friendLoadables
      .filter(({state}) => state === 'hasValue')
      .map(({contents}) => contents);
  },
});
```

## 预取

出于性能方面的考虑，你可能希望在渲染**之前**就开始获取数据。这样，在我们开始渲染的时候，查询就可以开始了。[React docs](https://reactjs.org/docs/concurrent-mode-suspense.html#start-fetching-early) 中给出了一些示例。 这种模式也适用于 Recoil。

让我们改变一下上面的例子，一旦用户点击改变用户的按钮，就启动对下一个用户信息的获取。

```jsx
function CurrentUserInfo() {
  const currentUser = useRecoilValue(currentUserInfoQuery);
  const friends = useRecoilValue(friendsInfoQuery);

  const changeUser = useRecoilCallback(({snapshot, set}) => userID => {
    snapshot.getLoadable(userInfoQuery(userID)); // 预取用户信息
    set(currentUserIDState, userID); //  改变当前用户以开始新的渲染
  });

  return (
    <div>
      <h1>{currentUser.name}</h1>
      <ul>
        {friends.map(friend =>
          <li key={friend.id} onClick={() => changeUser(friend.id)}>
            {friend.name}
          </li>
        )}
      </ul>
    </div>
  );
}
```

## 查询默认 Atom 值

常见的模式是使用一个 atom 来代表本地可编辑的状态，但使用一个 selector 来查询默认值。

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: selector({
    key: 'CurrentUserID/Default',
    get: () => myFetchCurrentUserID(),
  }),
});
```

如果你想要双向同步数据，那么可以考虑实用 [atom effects](/docs/guides/atom-effects)。

## 不带 React Suspense 的异步查询

没有必要使用 React Suspense 来处理未决的异步 selector。你也可以使用 [`useRecoilValueLoadable()`](/docs/api-reference/core/useRecoilValueLoadable) 钩子来确定渲染期间的状态：

```jsx
function UserInfo({userID}) {
  const userNameLoadable = useRecoilValueLoadable(userNameQuery(userID));
  switch (userNameLoadable.state) {
    case 'hasValue':
      return <div>{userNameLoadable.contents}</div>;
    case 'loading':
      return <div>加载中……</div>;
    case 'hasError':
      throw userNameLoadable.contents;
  }
}
```

## 查询刷新

当使用 selector 为数据查询建模时，重要的是要记住，selector 的计算总能为给定的状态提供一个一致的值。 selector 代表从其他 atom 和 selector 状态派生出来的状态。 因此，对于一个给定的输入，selector 的计算函数应该是幂等的，因为它可能被缓存或执行多次。 实际上，这意味着单一的选择器不应该被用于查询在应用程序的生命周期内会有变化的结果。

你可以使用一些模式来处理易变的数据：

### 使用请求ID
selector 的计算应该根据输入（依赖状态或族参数）为一个给定的状态提供一个一致的值。因此，你可以将请求 ID 作为族参数或依赖关系添加到你的查询中。 例如：

```jsx
const userInfoQueryRequestIDState = atomFamily({
  key: 'UserInfoQueryRequestID',
  default: 0,
});

const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: userID => async ({get}) => {
    get(userInfoQueryRequestIDState(userID)); // 添加请求ID作为依赖关系
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response;
  },
});

function useRefreshUserInfo(userID) {
  const setUserInfoQueryRequestID = useSetRecoilState(userInfoQueryRequestIDState(userID));
  return () => {
    setUserInfoQueryRequestID(requestID => requestID + 1);
  };
}

function CurrentUserInfo() {
  const currentUserID = useRecoilValue(currentUserIDState);
  const currentUserInfo = useRecoilValue(userInfoQuery(currentUserID));
  const refreshUserInfo = useRefreshUserInfo(currentUserID);

  return (
    <div>
      <h1>{currentUser.name}</h1>
      <button onClick={refreshUserInfo}>刷新</button>
    </div>
  );
}
```

### 使用 Atom
另一个选择是使用 Atom，而不是 Selector，来为查询结果建模。 你可以根据你的刷新策略，用新的查询结果强制性地更新 atom 状态。

```jsx
const userInfoState = atomFamily({
  key: 'UserInfo',
  default: userID => fetch(userInfoURL(userID)),
});

// 刷新查询的 React 组件
function RefreshUserInfo({userID}) {
  const refreshUserInfo = useRecoilCallback(({set}) => async id => {
    const userInfo = await myDBQuery({userID});
    set(userInfoState(userID), userInfo);
  }, [userID]);

  // 每秒钟刷新一次用户信息
  useEffect(() => {
    const intervalID = setInterval(refreshUserInfo, 1000);
    return () => clearInterval(intervalID);
  }, [refreshUserInfo]);

  return null;
}
```

如果这是你想要的效果，但这种方法的一个缺点是，atom **目前**不支持接受 `Promise` 作为新值，以便在查询刷新时自动利用 React Suspense。 然而，如果需要的话，你可以存储一个对象，对加载状态和结果进行手动编码。

还可以考虑 [atom effects](/docs/guides/atom-effects) 来查询原子的同步状态。
