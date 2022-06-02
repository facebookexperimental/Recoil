---
title: graphQLSubscriptionEffect()
sidebar_label: graphQLSubscriptionEffect()
---

The underlying [atom effect](/docs/guides/atom-effects) for syncing a Recoil [atom](/docs/api-reference/core/atom) with a **GraphQL subscription**.  It initializes an atom based on the results of a GraphQL subscription and subscribes to updates from the server.

---

```jsx
function graphQLSubscriptionEffect<
  TVariables: Variables,
  TData: $ReadOnly<{[string]: mixed}>,
  T = TData,
  TRawResponse = void,
>({
  environment: IEnvironment | EnvironmentKey,
  subscription: GraphQLSubscription<TVariables, TData, TRawResponse>,
  variables: TVariables | null,
  mapResponse: TData => T,
}): AtomEffect<T>
```

- `environment`: The Relay Environment or an [`EnvironmentKey`](/docs/recoil-relay/api/EnvironmentKey) to match with the environment provided with [`<RecoilRelayEnvironemnt>`](/docs/recoil-relay/api/RecoilRelayEnvironment).
- `subscription`: The GraphQL subscription to query.
- `variables`: [Variables](https://graphql.org/learn/queries/#variables) object provided as input to the GraphQL query.  If `null`, then skip query and use the default atom value.
- `mapResponse`: Callback to map the query response to the atom value.

---

```jsx
const myAtom = atom({
  key: 'MyQuery',
  effects: [
    graphQLSubscriptionEffect({
      environment: myEnvironment,
      query: graphql`
        subscription MyEventSubscription($id: ID!) {
          myevent(id: $id) {
            id
            name
          }
        }
      `,
      variables: {id: 123},
    }),
  ],
});
```
