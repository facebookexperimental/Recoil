---
title: GraphQL Subscriptions
sidebar_label: GraphQL Subscriptions
---

While [GraphQL queries](/docs/recoil-relay/graphql-queries) will subscribe to changes from locally issued mutations or live updates, you may also want to subscribe to updates that are pushed by the server.  In this situation you can use a **GraphQL _subscription_** instead of a **GraphQL _query_**.  GraphQL subscriptions require a different implementation on the server to support initiating remote updates.

```jsx
const userSubscription = graphQLSelector({
  key: 'UserSubscription',
  environment: myEnvironmentKey,
  query: graphql`
    subscription UserSubscription($id: ID!) {
      user(id: $id) {
        name
        address
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: data => data.user,
});
```
