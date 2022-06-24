---
title: graphQLQueryEffect()
sidebar_label: graphQLQueryEffect()
---

The underlying [atom effect](/docs/guides/atom-effects) for syncing a Recoil [atom](/docs/api-reference/core/atom) with a [GraphQL query](https://graphql.org/learn/queries/).  It initializes an atom based on the results of a GraphQL query and subscribes to local mutations or updates.

If you would like to subscribe to updates that are initiated by the server consider using [`graphQLSubscriptionEffect()`](/docs/recoil-relay/api/graphQLSubscriptionEffect) and GraphQL subscriptions instead.

---

```jsx
function graphQLQueryEffect<
  TVariables: Variables,
  TData: $ReadOnly<{[string]: mixed}>,
  T = TData,
  TRawResponse = void,
>({
  environment: IEnvironment | EnvironmentKey,
  query: Query<TVariables, TData, TRawResponse>,
  variables: TVariables | null,
  mapResponse: TData => T,
}): AtomEffect<T>
```

- `environment`: The Relay Environment or an [`EnvironmentKey`](/docs/recoil-relay/api/EnvironmentKey) to match with the environment provided with [`<RecoilRelayEnvironemnt>`](/docs/recoil-relay/api/RecoilRelayEnvironment).
- `query`: The [GraphQL query](https://graphql.org/learn/queries/) to query.  [Fragments](/docs/recoil-relay/graphql-queries#graphql-fragments) are supported in queries.
- `variables`: [Variables](https://graphql.org/learn/queries/#variables) object provided as input to the GraphQL query.  If `null`, then skip query and use the default atom value.
- `mapResponse`: Callback to map the query response to the atom value.

---

```jsx
const myAtom = atom({
  key: 'MyQuery',
  effects: [
    graphQLQueryEffect({
      environment: myEnvironment,
      query: graphql`
        query MyEventQuery($id: ID!) {
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
