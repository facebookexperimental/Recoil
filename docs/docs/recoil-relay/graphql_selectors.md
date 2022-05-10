---
title: GraphQL Selectors
sidebar_label: GraphQL Selectors
---

The underlying Relay GraphQL support is provided via the [GraphQL Atom Effects](/docs/recoil-relay/graphql_effects).  For your convenience some selectors are provided to make most of the common usage patterns easier to use.  First, make sure to [setup your Relay environment](/docs/recoil-relay/environment).

## Simple GraphQL Query

[**`graphQLSelector()`**](/docs/recoil-relay/api/graphQLSelector) can be used to create a selector which is synced with a **GraphQL query**.  This selector helps GraphQL queries and the Recoil data-flow graph stay in sync.  It can depend on upstream Recoil atoms/selectors to determine the `variables` to use for the GraphQL query or transform the results.  Any local updates or mutations to the Relay GraphQL state will also automatically sync with the selector and cause it to update.  This allows you to treat the server as the source of truth with the selector as a local cache.

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
    const icon = await fetch(urlForCount(seenCount));
    return icon;
  },
});
```

## GraphQL Query with Parameters

[**`graphQLSelectorFamily()`**](/docs/recoil-relay/api/graphQLSelectorFamily) allows you to use parameters in addition to other Recoil state for computing query variables.  Parameters can be determined basd on a component's props, React state, used in another Recoil selector, etc.

```jsx
const queryWithParams = graphQLSelectorFamily({
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
  const results = useRecoilValue(queryWithParams(props.eventID));
  ...
}
```

## GraphQL Mutations

The GraphQL selectors will perform an initial query as well as subscribe to any changes.  You can use Relay APIs such as [**`useMutation()`**](https://relay.dev/docs/api-reference/use-mutation) and[**`commitMutation()`**](https://relay.dev/docs/api-reference/commit-mutation) to update the state on the server.  These changes will also sync and cause the Recoil GraphQL selectors to update.  This allows you to treat the server as the source of truth with the selector as a local cache.

```jsx
function MyComponent(props) {
  const eventInfo = useRecoilValue(queryWithParams(props.eventID));
  const [commitEvent] = useMutation(graphql`
    mutation MyEventMutation($input: MyEventData!) {
      myevent_mutation(data: $input) {
        myevent {
          name
          timestamp
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
  )
  ...
}
```
## Write-through Cache

## GraphQL Subscription

While GraphQL selectors will subscribe to changes from locally issued mutations you may also want to subscribe to mutations that are remotely initiated by the server.  In this situation you can use a **GraphQL subscription** instead of a GraphQL query.  GraphQL subscriptions require a different implementation on the server to support initiating remote updates.

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
