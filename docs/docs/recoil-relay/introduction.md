---
title: Recoil and GraphQL with Relay
sidebar_label: Introduction
---

The `recoil-relay` library helps Recoil perform type safe and efficient queries using [GraphQL](https://graphql.org/) with the [Relay](https://relay.dev) library.  This enables selectors which can easily query GraphQL.  The queries are synced with the Recoil data-flow graph so downstream selectors can derive state from them, they can depend on upstream Recoil state, and they are automatically subscribed to any changes in the graph.  Everything stays in sync automatically.

## Example
After setting up your Relay environment adding a GraphQL query is as simple as defining a [GraphQL selector](/docs/recoil-relay/graphql-selectors).

```jsx
const userNameQuery = graphQLSelector({
  key: 'UserName',
  environment: myEnvironment,
  query: graphql`
    query UserQuery($id: ID!) {
      user(id: $id) {
        name
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: data => data?.user?.name,
});
```
```jsx
function MyComponent() {
  const userName = useRecoilValue(userNameQuery);
  return <span>{userName}</span>;
}
```

## Installation

Follow the [Relay documentation](https://relay.dev/docs/getting-started/installation-and-setup/) for installing and setting up the Relay library, GraphQL compiler, Babel plugin, and ESLint plugin.  Then add `recoil-relay` as another dependency.
