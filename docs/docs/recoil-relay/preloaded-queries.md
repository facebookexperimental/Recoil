---
title: Preloaded Queries
sidebar_label: Preloaded Queries
---

## Pre-fetch GraphQL

GraphQL queries can also be pre-fetched using the [pre-fetching pattern](/docs/guides/asynchronous-data-queries#pre-fetching)

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

If you are using [EntryPoints](https://relay.dev/docs/guides/entrypoints), then you can preload queries in parallel with loading most of the JS for your page.

First, make sure you register an `EnvironmentKey` for your preloaded queries at your applications root:
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
export const seenCountQuery = graphQLSelector({
  key: 'SeenCount',
  environmentKey: preloadedEnvironmentKey,
  query: graphql`
    query FeedbackQuery($id: ID!) @preloadable {
      feedback(id: $id) {
        seen_count
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: data => data?.feedback?.seen_count,
});
```
Finally, add this query to the preloaded queries in your `*.entrypoint.js` file:
```jsx
const MyEntryPoint = {
  getPreloadProps: params => ({
    queries: {
      seenCountQuery: {
        parameters: require('FeedbackQuery$Parameters'),
        variables: {id: params.id},
      },
  }),
  root: JSResource('m#MyApp.react'),
};
```
