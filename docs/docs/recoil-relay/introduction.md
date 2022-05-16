---
title: Recoil and GraphQL with Relay
sidebar_label: Introduction
---
---
> ## ❗️ _Preview Documentation_ ❗️
> ***This is preview documentation for the recoil-relay library before it is released.***<br/>
>

---
The `recoil-relay` library helps Recoil perform type safe and efficient queries using [GraphQL](https://graphql.org/) with the [Relay](https://relay.dev) library.  It provides selectors which can easily query with GraphQL.  The queries are synced with the Recoil data-flow graph so downstream selectors can derive state from them, they can depend on upstream Recoil state, and they are automatically subscribed to any changes in the graph from Relay.  Everything stays in sync automatically.

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
  mapResponse: data => data.user?.name,
});
```
Then use it like any other Recoil [selector](/docs/api-reference/core/selector):
```jsx
function MyComponent() {
  const userName = useRecoilValue(userNameQuery);
  return <span>{userName}</span>;
}
```

## Installation

Please see the [Recoil installation guide](/docs/introduction/installation) for installing Recoil and the [Relay documentation](https://relay.dev/docs/getting-started/installation-and-setup/) for installing and setting up the Relay library, GraphQL compiler, Babel plugin, and ESLint plugin.  Then add `recoil-relay` as a dependency.
