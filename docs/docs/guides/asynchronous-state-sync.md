---
title: Asynchronous State Sync
sidebar_label: Asynchronous State Sync
---

Recoil [atoms](/docs/api-reference/core/atom) represent local application state.  Your application may have remote or server-side state as well, such as via a RESTful API.  Consider synchronizing the remote state with Recoil atoms.  Doing this allows you to easily access or write to the  state from React components using the `useRecoilState()` hook, or use that state as input to the Recoil data-flow graph for other derived state selectors.  If you're looking to [query a database or server for read-only data](asynchronous-data-queries), consider using asynchronous selectors.

## Local State Example

This example provides the friend status as local state only.

```jsx
const currentUserIDState = atom({
  key: 'CurrentUserID',
  default: null,
});

function CurrentUserInfo() {
  const [currentUserID] = useRecoilState(currentUserIDState);
  return <div>Current User: {currentUserID}</div>;
}
```

## Sync State From Server

We can subscribe to asynchronous changes in the remote state and update the atom value to match.  This can be done using standard React [`useEffect()`](https://reactjs.org/docs/hooks-reference.html#useeffect) hook or other popular libraries.

```jsx
function CurrentUserIDSubscription() {
  const setCurrentUserID = useSetRecoilState(currentUserIDState);

  useEffect(() => {
    RemoteStateAPI.subscribeToCurrentUserID(setCurrentUserID);
    // Specify how to cleanup after this effect
    return function cleanup() {
      RemoteServerAPI.unsubscribeFromFriendStatus(setCurrentUserID);
    };
  }, []);

  return null;
}

function MyApp() {
  return (
    <RecoilRoot>
      <CurrentUserIDSubscription />
      <CurrentUserInfo />
    </RecoilRoot>
  );
}
```

If you want to handle synchronization of multiple atoms in a single place, you can also use the [State Persistence](persistence) pattern.

## Bi-Directional Synching

You can also sync the state so local changes are updated on the server.  Note that this is a simplified example, please take care to avoid feedback loops.

```jsx
function CurrentUserIDSubscription() {
  const [currentUserID, setCurrentUserID] = useRecoilState(currentUserIDState);
  const knownServerCurrentUserID = useRef(currentUserID);

  // Subscribe server changes to update atom state
  useEffect(() => {
    function handleUserChange(id) {
      knownServerCurrentUserID.current = id;
      setCurrentUserID(id);
    }

    RemoteStateAPI.subscribeToCurrentUserID(handleUserChange);
    // Specify how to cleanup after this effect
    return function cleanup() {
      RemoteServerAPI.unsubscribeFromFriendStatus(handleUserChange);
    };
  }, [knownServerCurrentUserID]);

  // Subscribe atom changes to update server state
  useEffect(() => {
    if (currentUserID !== knownServerCurrentUserID.current) {
      knownServerCurrentID.current = currentUserID;
      RemoteServerAPI.updateCurrentUser(currentUserID);
    }
  }, [currentUserID, knownServerCurrentUserID.current]);

  return null;
}
```

## Synching State with Parameters

You can also use the [`atomFamily`](/docs/api-reference/utils/atomFamily) helper to sync local state based on parameters.  Note that each call of this example hook will create a subscription, so take care to avoid redundant usage.

```jsx
const friendStatusState = atomFamily({
  key: 'Friend Status',
  default: 'offline',
});

function useFriendStatusSubscription(id) {
  const setStatus = useSetRecoilState(friendStatusState(id));

  useEffect(() => {
    RemoteStateAPI.subscribeToFriendStatus(id, setStatus);
    // Specify how to cleanup after this effect
    return function cleanup() {
      RemoteServerAPI.unsubscribeFromFriendStatus(id, setStatus);
    };
  }, []);
}
```

## Data-Flow Graph

An advantage of using atoms to represent remote state is that you can use it as input for other derived state.  The following example will show the current user and friend list based on the current server state.  If the server changes the current user it will re-render the entire list, if it only changes the status of a friend then only that list entry will be re-rendered.  If a list item is clicked on, it will change the current user locally and will update the server state.

```jsx
const userInfoQuery = selectorFamily({
  key: 'UserInfoQuery',
  get: userID => async ({get}) => {
    const response = await myDBQuery({userID});
    if (response.error) {
      throw response.error;
    }
    return response;
  },
});

const currentUserInfoQuery = selector({
  key: 'CurrentUserInfoQuery',
  get: ({get}) => get(userInfoQuery(get(currentUserIDState)),
});

const friendColorState = selectorFamily({
  key: 'FriendColor',
  get: friendID => ({get}) => {
    const [status] = useRecoilState(friendStatusState(friendID));
    return status === 'offline' ? 'red' : 'green';
  }
})

function FriendStatus({friendID}) {
  useFriendStatusSubscription(friendID);
  const [status] = useRecoilState(friendStatusState(friendID));
  const [color] = useRecoilState(friendColorState(friendID));
  const [friend] = useRecoilState(userInfoQuery(friendID));
  return (
    <div style={{color}}>
      Name: {friend.name}
      Status: {status}
    </div>
  );
}

function CurrentUserInfo() {
  const {name, friendList} = useRecoilValue(currentUserInfoQuery)
  const setCurrentUserID = useSetRecoilState(currentUserIDState);
  return (
    <div>
      <h1>{name}</h1>
      <ul>
        {friendList.map(friendID =>
          <li key={friend.id} onClick={() => setCurrentUserID(friend.id)}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <FriendStatus friendID={friendID} />
            </React.Suspense>
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
          <CurrentUserIDSubscription />
          <CurrentUserInfo />
        </React.Suspense>
      </ErrorBoundary>
    </RecoilRoot>
  );
}
```
