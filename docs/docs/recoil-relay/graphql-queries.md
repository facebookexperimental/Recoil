---
title: GraphQL Queries
sidebar_label: GraphQL Queries
---

GraphQL queries can be done using [**`graphQLSelector()`**](/docs/recoil-relay/api/graphQLSelector) and [**`graphQLSelectorFamily()`**](/docs/recoil-relay/api/graphQLSelectorFamily).  (The underlying support is provided via [atom effects](/docs/recoil-relay/graphql-effects)).  But first, make sure to [setup your Relay environment](/docs/recoil-relay/environment).

## Simple GraphQL Query

[**`graphQLSelector()`**](/docs/recoil-relay/api/graphQLSelector) can be used to create a selector which is synced with a [**GraphQL query**](https://graphql.org/learn/queries/).  This selector helps GraphQL queries and the Recoil data-flow graph stay in sync.  It can depend on upstream Recoil atoms/selectors to determine the [`variables`](https://graphql.org/learn/queries/#variables) to use for the GraphQL query or transform the results.  Any live queries, deferred data, local updates or mutations to the Relay GraphQL state will also automatically sync with the selector and cause it to update.  This allows you to treat the server as the source of truth with the selector as a local cache.

```jsx
const userNameQuery = graphQLSelector({
  key: 'UserName',
  environment: myEnvironmentKey,
  query: graphql`
    query UserNameQuery($id: ID!) {
      user(id: $id) {
        name
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: data => data.user?.name,
});
```
```jsx
function MyComponent() {
  const seenCount = useRecoilValue(seenCountQuery);
  return <span>{seenCount}</span>;
}
```

In addition to using other upstream atoms/selectors to compute the GraphQL query variables, the [`graphQLSelector()`](/docs/recoil-relay/api/graphQLSelector) can also be used by other downstream selectors to provide derived state.

```jsx
const pictureForUserState = selector({
  key: 'PictureForUser',
  get: async ({get}) => {
    const username = get(userNameQuery);
    const picture = await fetch(urlForUserNamePicture(username));
    return picture;
  },
});
```

## GraphQL Query with Parameters

[**`graphQLSelectorFamily()`**](/docs/recoil-relay/api/graphQLSelectorFamily) allows you to use parameters in addition to other Recoil state for computing query variables.  Parameters can be determined basd on a component's props, React state, used in another Recoil selector, etc.

```jsx
const userQuery = graphQLSelectorFamily({
  key: 'UserQuery',
  environment: myEnvironmentKey,
  query: graphql`
    query UserQuery($id: ID!, $clientID: ClientID!) {
      user(id: $id, client_id: $clientID) {
        name
        address
      }
    }
  `,
  variables: id => ({get}) => ({id, clientID: get(clientIDAtom}),
  mapResponse: data => data.user,
});
```
```jsx
function MyComponent(props) {
  const user = useRecoilValue(userQuery(props.userID));

  return (
    <div>
      <h1>{user.name}</h1>
    </div>
  );
}
```

## GraphQL Fragments

GraphQL queries can also include [**GraphQL fragments**](https://graphql.org/learn/queries/#fragments) through the use of `readInlineData()`.

```jsx
const userNameFragment = graphql`
  fragment UserNameFragment on User @inline {
    name
  }
`;
```

```jsx
import {readInlineData} from 'relay-runtime';

const userNameQuery = graphQLSelectorFamily({
  key: 'UserNameQuery',
  environment: myEnvironmentKey,
  query: graphql`
    query UserNameQuery($id: ID!) {
      user(id: $id) {
        ...UserNameFragment
      }
    }
  `,
  variables: id => ({id}),
  mapResponse: response => {
    const userFragment = readInlineData(userNameFragment, response.user);
    return userFragment?.name;
  },
})
```


## Pre-fetch GraphQL

GraphQL queries can also be pre-fetched using the [pre-fetching pattern](/docs/guides/asynchronous-data-queries#pre-fetching):

```jsx
function CurrentUserInfo() {
  const currentUserID = useRecoilValue(currentUserIDState);
  const userInfo = useRecoilValue(userInfoQuery(currentUserID));

  const changeUser = useRecoilCallback(({snapshot, set}) => userID => {
    // pre-fetch user info
    snapshot.getLoadable(userInfoQuery(userID));

    // change current user to start new render
    set(currentUserIDState, userID);
  });

  return (
    <div>
      <h1>{userInfo.name}</h1>
      <ul>
        {userInfo.friends.map(friend =>
          <li key={friend.id} onClick={() => changeUser(friend.id)}>
            {friend.name}
          </li>
        )}
      </ul>
    </div>
  );
}
```

## Preloaded GraphQL

If you are using [EntryPoints](https://relay.dev/docs/api-reference/use-entrypoint-loader/), then you can preload queries in parallel with loading most of the JS for your page.

First, make sure you [register an `EnvironmentKey`](/docs/recoil-relay/environment) for your preloaded queries at your applications root:
```jsx
export const preloadedEnvironmentKey = new EnvironmentKey('preloaded');

export function AppRoot() {
  const preloadedEnvironment = useRelayEnvironment();
  return (
    <RecoilRoot>
      <RecoilRelayEnvironment
        environmentKey={preloadedEnvironmentKey}
        environment={preloadedEnvironment}>
        {/* My App */}
      </RecoilRelayEnvironment>
    </RecoilRoot>
  )
}
```
Then, direct your queries to use this `preloadedEnvironmentKey` and add a `@preloadable` decorator to the GraphQL:
```jsx
export const userQuery = graphQLSelector({
  key: 'UserQuery',
  environmentKey: preloadedEnvironmentKey,
  query: graphql`
    query UserQuery($id: ID!) @preloadable {
      user(id: $id) {
        name
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: data => data?.user,
});
```
Finally, add this query to the preloaded queries in your `*.entrypoint.js` file:
```jsx
const MyEntryPoint = {
  getPreloadProps: params => ({
    queries: {
      userQuery: {
        parameters: require('UserQuery$Parameters'),
        variables: {id: params.id},
      },
  }),
  root: JSResource('m#MyApp.react'),
};
```
