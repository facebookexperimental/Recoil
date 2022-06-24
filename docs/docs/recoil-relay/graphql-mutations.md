---
title: GraphQL Mutations
sidebar_label: GraphQL Mutations
---

## GraphQL Mutations

The [GraphQL selectors](/docs/recoil-relay/graphql-queries) will perform an initial query as well as subscribe to any changes.  You can use Relay APIs such as [**`useMutation()`**](https://relay.dev/docs/api-reference/use-mutation) and[**`commitMutation()`**](https://relay.dev/docs/api-reference/commit-mutation) to update the state on the server.  These changes will also sync and cause the Recoil GraphQL selectors to update.  This allows you to treat the server as the source of truth with the selector as a local cache.

```jsx
function MyComponent(props) {
  const user = useRecoilValue(userQuery(props.userID));
  const [commitEvent] = useMutation(graphql`
    mutation UserMutation($input: UsertNameChangeData!) {
      user_mutation(data: $input) {
        user {
          id
          name
        }
      }
    }
  `);

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => {
        commitEvent({
          variables: {
            input: {
              id: props.userID,
              name: 'New Name',
            },
          },
        });
      }}>Change Name</button>
    </div>
  );
}
```
## Write-through Cache

Another pattern you can use for updating state is to treat the Recoil selector as a local write-through cache for the server.  It is a writable selector, so local updates will immediately be reflected in the UI.  If you provide [**GraphQL mutation**](https://graphql.org/learn/queries/#mutations) information, then updating the selector will also initiate a mutation with the server.

```jsx
const userState = graphQLSelector({
  key: 'User',
  environment: relayFBEnvironmentKey,
  query: graphql`
    query UserQuery($eventID: ID!, $clientID: ClientID!) {
      user(id: $eventID, client_id: $clientID) {
        name
        timestamp
      }
    }
  `,
  variables: id => ({get}) => ({id, clientID: get(clientIDAtom}),
  mapResponse: data => data.user,

  mutations: {
    mutation: graphql`
      mutation UserMutation($input: UserNameChangeData!) {
        user_mutation(data: $input) {
          user {
            id
            name
          }
        }
      }
    `,
    variables: newUserData => id => ({input: {id, name: newUserData.name}}),
  },
});
```
```jsx
function MyComponent() {
  const [user, setUser] = useRecoilState(userState);

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => {
        setUser(user => ({...user, name: 'New Name'}));
      }}>Change Name</button>
    </div>
  );
}
```

Note that when using Recoil as a write-through cache like this the Relay concept of "optimistic response" is not necessary for mutations since updating the selector will update the UI before the remote mutation is committed.  If there is an error from the server then the local update will be rolled back.
