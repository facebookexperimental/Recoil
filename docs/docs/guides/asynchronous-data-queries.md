---
title: Asynchronous Data Queries
sidebar_label: Asynchronous Data Queries
---

Recoil provides a way to map state and derived state to React components via a data-flow graph. What's really powerful is that the functions in the graph can also be asynchronous. This makes it easy to use asynchronous functions in synchronous React component render functions. Recoil allows you to seamlessly mix synchronous and asynchronous functions in your data-flow graph of selectors. Simply return a Promise to a value instead of the value itself from a selector `get` callback, the interface remains exactly the same. Because these are just selectors, other selectors can also depend on them to further transform the data.

Selectors can be used as one way to incorporate asynchronous data into the Recoil data-flow graph.  Please keep in mind that selectors represent pure functions: For a given set of inputs they should always produce the same results (at least for the lifetime of the application).  This is important as selector evaluations may execute one or more times, may be restarted, and may be cached.  Because of this, selectors are a good way to model read-only DB queries where repeating a query provides consistent data.  If you are looking to synchronize local and server state, then please see [Asynchronous State Sync](asynchronous-state-sync) or [State Persistence](persistence).

## Synchronous Example

For example, here is a simple synchronous [atom](/docs/api-reference/core/atom) and [selector](/docs/api-reference/core/selector) to get a user name:

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

## Asynchronous Example

If the user names were stored in some database we need to query, all we need to do is return a `Promise` or use an `async` function. If any dependencies change, the selector will be re-evaluated and execute a new query. The results are cached, so the query will only execute once per unique input.

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

The interface of the selector is the same, so the component using this selector doesn't need to care if it was backed with synchronous atom state, derived selector state, or asynchronous queries!

But, since React render functions are synchronous, what will it render before the promise resolves? Recoil is designed to work with [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html) to handle pending data. Wrapping your component with a Suspense boundary will catch any descendents that are still pending and render a fallback UI:

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

## Error Handling

But what if the request has an error? Recoil selectors can also throw errors which will then be thrown if a component tries to use that value. This can be caught with a React [`<ErrorBoundary>`](https://reactjs.org/docs/error-boundaries.html). For example:

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

## Queries with Parameters

Sometimes you want to be able to query based on parameters that aren't just based on derived state. For example, you may want to query based on the component props. You can do that using the [**`selectorFamily`**](/docs/api-reference/utils/selectorFamily) helper:

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
        <React.Suspense fallback={<div>Loading...</div>}>
          <UserInfo userID={1}/>
          <UserInfo userID={2}/>
          <UserInfo userID={3}/>
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Data-Flow Graph

Remember, by modeling queries as selectors, we can build a data-flow graph mixing state, derived state, and queries!  This graph will automatically update and re-render React components as state is updated.

The following example will render the current user's name and a list of their friends.  If a friend's name is clicked on, they will become the current user and the name and list will be automatically updated.

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
    const friends = [];
    for (const friendID of friendList) {
      const friendInfo = get(userInfoQuery(friendID));
      friends.push(friendInfo);
    }
    return friends;
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
        <React.Suspense fallback={<div>Loading...</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Concurrent Requests

If you notice in the above example, the `friendsInfoQuery` uses a query to get the info for each friend.  But, by doing this in a loop they are essentially serialized.  If the lookup is fast, maybe that's ok.  If it's expensive, you can use a concurrency helper such as [`waitForAll`](/docs/api-reference/utils/waitForAll), [`waitForNone`](/docs/api-reference/utils/waitForNone), or [`waitForAny`](/docs/api-reference/utils/waitForAny) to run them in parallel or handle partial results.  They accept both arrays and named objects of dependencies.

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

## Without React Suspense

It is not necessary to use React Suspense for handling pending asynchronous selectors. You can also use the [`useRecoilValueLoadable()`](/docs/api-reference/core/useRecoilValueLoadable) hook to determine the status during rendering:

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
