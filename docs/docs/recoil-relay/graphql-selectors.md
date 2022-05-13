---
title: GraphQL Selectors
sidebar_label: GraphQL Selectors
---

The underlying Relay GraphQL support is provided via the [GraphQL Atom Effects](/docs/recoil-relay/graphql-effects).  For your convenience some selectors are provided to make most of the common usage patterns easier to use.  First, make sure to [setup your Relay environment](/docs/recoil-relay/environment).

## Simple GraphQL Query

[**`graphQLSelector()`**](/docs/recoil-relay/api/graphQLSelector) can be used to create a selector which is synced with a [**GraphQL query**](https://graphql.org/learn/queries/).  This selector helps GraphQL queries and the Recoil data-flow graph stay in sync.  It can depend on upstream Recoil atoms/selectors to determine the [`variables`](https://graphql.org/learn/queries/#variables) to use for the GraphQL query or transform the results.  Any live queries, deferred data, local updates or mutations to the Relay GraphQL state will also automatically sync with the selector and cause it to update.  This allows you to treat the server as the source of truth with the selector as a local cache.

```jsx
const seenCountQuery = graphQLSelector({
  key: 'SeenCount',
  environment: myEnvironmentKey,
  query: graphql`
    query FeedbackQuery($id: ID!) {
      feedback(id: $id) {
        seen_count
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: data => data?.feedback?.seen_count,
});
```
```jsx
function MyComponent() {
  const seenCount = useRecoilValue(seenCountQuery);
  return <span>{seenCount}</span>;
}
```

In addition to using other upstream atoms/selectors to compute the GraphQL query variables, the `graphQLSelector()` can also be used by other downstream selectors to provide derived state.

```jsx
const iconForSeenCountState = selector({
  key: 'IconForSeenCount',
  get: async ({get}) => {
    const seenCount = get(seenCountQuery);
    const icon = await fetch(urlForCountIcon(seenCount));
    return icon;
  },
});
```

## GraphQL Query with Parameters

[**`graphQLSelectorFamily()`**](/docs/recoil-relay/api/graphQLSelectorFamily) allows you to use parameters in addition to other Recoil state for computing query variables.  Parameters can be determined basd on a component's props, React state, used in another Recoil selector, etc.

```jsx
const eventQuery = graphQLSelectorFamily({
  key: 'EventQuery',
  environment: myEnvironmentKey,
  query: graphql`
    query MyEventQuery($eventID: ID!, $clientID: ClientID!) {
      myevent(id: $eventID, client_id: $clientID) {
        name
        timestamp
      }
    }
  `,
  variables: eventID => ({get}) => ({eventID, clientID: get(clientIDAtom}),
});
```
```jsx
function MyComponent(props) {
  const eventInfo = useRecoilValue(eventQuery(props.eventID));

  return (
    <div>
      <h1>{eventInfo.data.name}</h1>
    </div>
  );
}
```

GraphQL queries can also be [preloaded](/docs/recoil-relay/preloaded-queries).

## GraphQL Mutations

The GraphQL selectors will perform an initial query as well as subscribe to any changes.  You can use Relay APIs such as [**`useMutation()`**](https://relay.dev/docs/api-reference/use-mutation) and[**`commitMutation()`**](https://relay.dev/docs/api-reference/commit-mutation) to update the state on the server.  These changes will also sync and cause the Recoil GraphQL selectors to update.  This allows you to treat the server as the source of truth with the selector as a local cache.

```jsx
function MyComponent(props) {
  const eventInfo = useRecoilValue(eventQuery(props.eventID));
  const [commitEvent] = useMutation(graphql`
    mutation MyEventMutation($input: MyEventNameChangeData!) {
      myevent_mutation(data: $input) {
        myevent {
          id
          name
        }
      }
    }
  `);

  return (
    <div>
      <h1>{eventInfo.data.name}</h1>
      <button onClick={() => {
        commitEvent({
          variables: {
            input: {
              id: props.eventID,
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
const eventState = graphQLSelector({
  key: 'Event',
  environment: relayFBEnvironmentKey,
  query: graphql`
    query MyEventQuery($eventID: ID!, $clientID: ClientID!) {
      myevent(id: $eventID, client_id: $clientID) {
        name
        timestamp
      }
    }
  `,
  variables: eventID => ({get}) => ({eventID, clientID: get(clientIDAtom}),
  mutations: {
    mutation: graphql`
      mutation MyEventMutation($input: MyEventNameChangeData!) {
        myevent_mutation(data: $input) {
          myevent {
            id
            name
          }
        }
      }
    `,
    variables: newEventData => eventID => ({input: {eventID, name: newEventData.name}}),
  },
});
```
```jsx
function MyComponent() {
  const [event, setEvent] = useRecoilState(eventState);

  return (
    <div>
      <h1>{eventInfo.data.name}</h1>
      <button onClick={() => {
        setEvent(event => ({...event, name: 'New Name'}));
      }}>Change Name</button>
    </div>
  );
}
```

Note that when using Recoil as a write-through cache like this the Relay concept of "optimistic response" is not necessary for mutations since updating the selector will update the UI before the remote mutation is committed.  If there is an error from the server then the local update will be rolled back.

## GraphQL Subscriptions

While GraphQL selectors will subscribe to changes from locally issued mutations or live updates, you may also want to subscribe to updates pushed by the server.  In this situation you can use a **GraphQL _subscription_** instead of a GraphQL _query_.  GraphQL subscriptions require a different implementation on the server to support initiating remote updates.

```jsx
const seenCountSubscription = graphQLSelector({
  key: 'SeenCountSubscription',
  environment: myEnvironmentKey,
  query: graphql`
    subscription FeedbackSubscription($id: ID!) {
      feedback(id: $id) {
        seen_count
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: data => data?.feedback?.seen_count,
});
```
