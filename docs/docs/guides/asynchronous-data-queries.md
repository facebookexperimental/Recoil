---
title: Asynchronous Data Queries
sidebar_label: Asynchronous Data Queries
---

Recoil provides a way to map state and derived state to React components via a data-flow graph. What's really powerful is that the functions in the graph can also be asynchronous. This makes it easy to use asynchronous functions in synchronous React component render functions. Recoil allows you to seamlessly mix synchronous and asynchronous functions in your data-flow graph of selectors. Simply return a Promise to a value instead of the value itself from a selector `get` callback, the interface remains exactly the same. Because these are just selectors, other selectors can also depend on them to further transform the data.

Selectors can be used as one way to incorporate asynchronous data into the Recoil data-flow graph.  Please keep in mind that selectors represent "idempotent" functions: For a given set of inputs they should always produce the same results (at least for the lifetime of the application).  This is important as selector evaluations may be cached, restarted, or executed multiple times.  Because of this, selectors are generally a good way to model read-only DB queries.  For mutable data you can use a [Query Refresh](#query-refresh).  Or to synchronize mutable state, persist state, or for other side-effects, consider the [**Atom Effects**](/docs/guides/atom-effects) API or the [**Recoil Sync Library**](/docs/recoil-sync/introduction).

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

But, since React render functions are synchronous, what will it render before the promise resolves? Recoil is designed to work with [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html) to handle pending data. Wrapping your component with a Suspense boundary will catch any descendants that are still pending and render a fallback UI:

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

Sometimes you want to be able to query based on parameters that aren't just based on derived state. For example, you may want to query based on the component props. You can do that using the [**`selectorFamily()`**](/docs/api-reference/utils/selectorFamily) helper:

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
        <React.Suspense fallback={<div>Loading...</div>}>
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```

## Concurrent Requests

If you notice in the above example, the `friendsInfoQuery` uses a query to get the info for each friend.  But, by doing this in a loop they are essentially serialized.  If the lookup is fast, maybe that's ok.  If it's expensive, you can use a concurrency helper such as [`waitForAll`](/docs/api-reference/utils/waitForAll) to run them in parallel.  This helper accepts both arrays and named objects of dependencies.

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

You can use [`waitForNone`](/docs/api-reference/utils/waitForNone) to handle incremental updates to the UI with partial data

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

## Pre-Fetching

For performance reasons you may wish to kick off fetching *before* rendering.  That way the query can be going while we start rendering.  The [React docs](https://reactjs.org/docs/concurrent-mode-suspense.html#start-fetching-early) give some examples.  This pattern works with Recoil as well.

Let's change the above example to initiate a fetch for the next user info as soon as the user clicks the button to change users:

```jsx
function CurrentUserInfo() {
  const currentUser = useRecoilValue(currentUserInfoQuery);
  const friends = useRecoilValue(friendsInfoQuery);

  const changeUser = useRecoilCallback(({snapshot, set}) => userID => {
    snapshot.getLoadable(userInfoQuery(userID)); // pre-fetch user info
    set(currentUserIDState, userID); // change current user to start new render
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

Note that this pre-fetching works by triggering the [`selectorFamily()`](/docs/api-reference/utils/selectorFamily) to initiate an async query and populate the selector's cache.  If you are using an [`atomFamily()`](/docs/api-reference/utils/atomFamily) instead, by either setting the atoms or relying on atom effects to initialize, then you should use [`useRecoilTransaction_UNSTABLE()`](/docs/api-reference/core/useRecoilTransaction) instead of [`useRecoilCallback()`](/docs/api-reference/core/useRecoilCallback), as trying to set the state of the provided `Snapshot` will have no effect on the live state in the host `<RecoilRoot>`.

## Query Default Atom Values

A common pattern is to use an atom to represent local editable state, but use a promise to query default values:

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: myFetchCurrentUserID(),
});
```

Or use a selector to defer the query or depend on other state.  Note that when using a selector the default atom value will remain dynamic, and update along with selector updates, until the atom is explicitly set by the user.

```jsx
const UserInfoState = atom({
  key: 'UserInfo',
  default: selector({
    key: 'UserInfo/Default',
    get: ({get}) => myFetchUserInfo(get(currentUserIDState)),
  }),
});
```

This can also be used with atom families:

```jsx
const userInfoState = atomFamily({
  key: 'UserInfo',
  default: id  => myFetchUserInfo(id),
});
```

```jsx
const userInfoState = atomFamily({
  key: 'UserInfo',
  default: selectorFamily({
    key: 'UserInfo/Default',
    get: id => ({get}) => myFetchUserInfo(id, get(paramsState)),
  }),
});
```

If you would like bi-directional syncing of data, then consider [atom effects](/docs/guides/atom-effects).

## Async Queries Without React Suspense

It is not necessary to use React Suspense for handling pending asynchronous selectors. You can also use the [`useRecoilValueLoadable()`](/docs/api-reference/core/useRecoilValueLoadable) hook to determine the current status during rendering:

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

## Query Refresh

When using selectors to model data queries, selector evaluation should always provide a consistent value for a given state.  Selectors represent state derived from other atom and selector states.  Thus, selector evaluation functions should be idempotent for a given input, as it may be cached or executed multiple times.  However, if selectors obtain data from data queries it may be helpful for them to re-query in order to refresh with newer data or re-try after a failure.  There are a few ways to achieve this:

### `useRecoilRefresher()`

The [`useRecoilRefresher_UNSTABLE()`](/docs/api-reference/core/useRecoilRefresher) hook can be used to get a callback which you can call to clear any caches and force it to re-evaluate.

```jsx
const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: userID => async () => {
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response.data;
  }
})

function CurrentUserInfo() {
  const currentUserID = useRecoilValue(currentUserIDState);
  const currentUserInfo = useRecoilValue(userInfoQuery(currentUserID));
  const refreshUserInfo = useRecoilRefresher_UNSTABLE(userInfoQuery(currentUserID));

  return (
    <div>
      <h1>{currentUserInfo.name}</h1>
      <button onClick={() => refreshUserInfo()}>Refresh</button>
    </div>
  );
}
```

### Use a Request ID
Selector evaluation should provide a consistent value for a given state based on its input (dependent state or family parameters).  So, you could add a request ID as either a family parameter or a dependency to your query.  For example:

```jsx
const userInfoQueryRequestIDState = atomFamily({
  key: 'UserInfoQueryRequestID',
  default: 0,
});

const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: userID => async ({get}) => {
    get(userInfoQueryRequestIDState(userID)); // Add request ID as a dependency
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response.data;
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
      <h1>{currentUserInfo.name}</h1>
      <button onClick={refreshUserInfo}>Refresh</button>
    </div>
  );
}
```

### Use an Atom
Another option is to use an atom, instead of a selector, to model the query results.  You can imperatively update the atom state with the new query results based on your refresh policy.

```jsx
const userInfoState = atomFamily({
  key: 'UserInfo',
  default: userID => fetch(userInfoURL(userID)),
});

// React component to refresh query
function RefreshUserInfo({userID}) {
  const refreshUserInfo = useRecoilCallback(({set}) => async id => {
    const userInfo = await myDBQuery({userID});
    set(userInfoState(userID), userInfo);
  }, [userID]);

  // Refresh user info every second
  useEffect(() => {
    const intervalID = setInterval(refreshUserInfo, 1000);
    return () => clearInterval(intervalID);
  }, [refreshUserInfo]);

  return null;
}
```

Note that atoms do not *currently* support accepting a `Promise` as the new value.  So, you cannot currently put the atom in a pending state for React Suspense while the query refresh is pending, if that is your desired behavior.  However, you could store an object which manually encodes the current loading status as well as the actual results to explicitly handle this.

Also consider [atom effects](/docs/guides/atom-effects) for query synchronization of atoms.

### Retry query from error message

Here's a fun little example to find and retry queries based on errors thrown and caught in an `<ErrorBoundary>`

```jsx
function QueryErrorMessage({error}) {
  const snapshot = useRecoilSnapshot();
  const selectors = useMemo(() => {
    const ret = [];
    for (const node of snapshot.getNodes_UNSTABLE({isInitialized: true})) {
      const {loadable, type} = snapshot.getInfo_UNSTABLE(node);
      if (loadable != null && loadable.state === 'hasError' && loadable.contents === error) {
        ret.push(node);
      }
    }
    return ret;
  }, [snapshot, error]);
  const retry = useRecoilCallback(({refresh}) =>
    () => selectors.forEach(refresh),
    [selectors],
  );

  return selectors.length > 0 && (
    <div>
      Error: {error.toString()}
      Query: {selectors[0].key}
      <button onClick={retry}>Retry</button>
    </div>
  );
}
```
