---
title: graphQLSelector()
sidebar_label: graphQLSelector()
---

`graphQLSelector()` creates a Recoil [selector](/docs/api-reference/core/selector) which syncs with the provided Relay environment and [GraphQL query or subscription](https://graphql.org/learn/queries/).  The selector will automatically update with any deferred data, live queries, or if any local commits or updates are performed which mutate that part of the graph.  The selector acts like a local cache with the server as the source of truth.  It is writable and can be configured to commit mutations to the server when updated as a write-through cache.

If you would like to pass a parameter from the consumer callsite to the query variables consider [`graphQLSelectorFamily()`](/docs/recoil-relay/api/graphQLSelectorFamily).

---
```jsx
function graphQLSelector<
  TVariables: Variables,
  TData: $ReadOnly<{[string]: mixed}>,
  T = TData,
  TRawResponse = void,
  TMutationVariables: Variables = {},
  TMutationData: $ReadOnly<{[string]: mixed}> = {},
  TMutationRawResponse = void,
>({
  key: string,

  environment: IEnvironment | EnvironmentKey,

  query:
    | Query<TVariables, TData, TRawResponse>
    | GraphQLSubscription<TVariables, TData, TRawResponse>,

  variables: null | TVariables | (({get: GetRecoilValue}) => (null | TVariables)),

  mapReponse?: (TData, {get: GetRecoilValue}) => T,

  default?: T,

  mutations?: {
    mutation: Mutation<TMutationVariables, TMudationData, TMutationRawResposne>,
    variables: T => ?TMutationVariables,
  },

}): RecoilState<T>
```
* **`key`** - A unique string used to identify the selector.
* **`environment`** - The Relay Environment or an [`EnvironmentKey`](/docs/recoil-relay/api/EnvironmentKey) to match with an environment pprovided by a surrounding [`<RecoilRelayEnvironment>`](/docs/recoil-relay/api/RecoilRelayEnvironment).
* **`query`** - A [GraphQL Query or Subscription](https://graphql.org/learn/queries/).
* **`variables`** - Callback to provide the [variables](https://graphql.org/learn/queries/#variables) object to use for the query.  This may be the variables object directly or a callback which has a `get()` function that allows the selector to reference other upstream Recoil atoms/selectors.  If `null` is provided as the variables then no query will be performed and the `default` value will be used instead.
* **`mapResponse`** - Optional callbak to transform the GraphQL results for using as the value of the selector.  It is also provided a `get()` function so it can reference other Recoil atoms/selectors to perform the transformation.
* **`default`** - The default value to use if `null` is provided as the `variables`.  If `default` is not provided then the selector will remain in a pending state.
* **`mutations`** - Optional configuration of a [GraphQL Mutation](https://graphql.org/learn/queries/#mutations) and variables to commit if the selector is explicitly written to.
---

### Simple Example
```jsx
const eventQuery = graphQLSelector({
  key: 'EventQuery',
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
});
```

### Query Based on Recoil State

The `variables` used for the query can depend on other upstreeam Recoil State.  The query will subscribe to this upstream state and will automatically update if the upstream state is changed.

```jsx
const eventQuery = graphQLSelector({
  key: 'EventQuery',
  environment: myEnvironment,
  query: graphql`
    query MyEventQuery($id: ID!) {
      myevent(id: $id) {
        id
        name
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
});
```

### Transform Response
The response from the server can be transformed for the value to use for the selector by using the `mapResponse` option.

```jsx
const eventNameQuery = graphQLSelector({
  key: 'EventNameQuery',
  environment: myEnvironment,
  query: graphql`
    query MyEventQuery($id: ID!) {
      myevent(id: $id) {
        id
        name
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: data => data?.myevent?.name,
});
```
The transformation can also reference other Recoil atoms/selectors.  It will subscribe to that upstream state and automatically update if the upstream state changes.
```jsx
const eventNameQuery = graphQLSelector({
  key: 'EventNameQuery',
  environment: myEnvironment,
  query: graphql`
    query MyEventQuery($id: ID!) {
      myevent(id: $id) {
        id
        name
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: (data, {get}) => get(prefixAtom) + ':' + data?.myevent?.name,
});
```

### Skip Query

Because the variables can depend on dynamic upstream state it is possible that for some states you may not wish to issue a query.  You can always avoid a query from being issued by returning `null` for the `variables`.  In this case the `default` value will be used.  If no `default` is provided then the selector will remain in a pending state.

```jsx
const eventNameQuery = graphQLSelector({
  key: 'EventNameQuery',
  environment: myEnvironment,
  query: graphql`
    query MyEventQuery($id: ID!) {
      myevent(id: $id) {
        id
        name
      }
    }
  `,
  variables: ({get}) => {
    const id = get(currentIDAtom);
    if (!isIDValid(id)) {
      return null;
    } else {
      return {id};
    }
  },
  default: 'PLACEHOLDER NAME',
  mapResponse: data => data?.myevent?.name,
});
```

### Mutations
`graphQLSelector()` acts as a local cache for the GraphQL server state as the source of truth.  It is writable and can be configured to commit a mutation to the server if written to.  See the [write-through cache example](/docs/recoil-relay/graphql-selectors#write-through-cache).
