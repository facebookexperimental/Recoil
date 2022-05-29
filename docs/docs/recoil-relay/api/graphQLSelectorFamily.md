---
title: graphQLSelectorFamily()
sidebar_label: graphQLSelectorFamily()
---

`graphQLSelectorFamily()` is similar to [`graphQLSelector()`](/docs/recoil-relay/api/graphQLSelector) except that it returns a function which accepts a parameter and returns a selector for that parameter.  This basically allows us to pass parameters to the query from the calling component based on props or other state.

---
```jsx
function graphQLSelectorFamily<
  TVariables: Variables,
  TData: $ReadOnly<{[string]: mixed}>,
  P: Parmaeter = TVariables,
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

  variables:
    | TVariables
    | P => null | TVariables
    | P => ({get: GetRecoilValue}) => null | TVariables,

  mapReponse:
    | (TData, {get: GetRecoilValue, variables: TVariables}) => T
    | (TData, {get: GetRecoilValue, variables: TVariables}) => P => T,

  default?:
    | T
    | P => T,

  mutations?: {
    mutation: Mutation<TMutationVariables, TMudationData, TMutationRawResposne>,
    variables:
      | T => null | TMutationVariables
      | T => P => null | TMutationVariables,
  },

}): P => RecoilState<T>
```
* **`key`** - A unique string used to identify the selector.
* **`environment`** - The Relay Environment or an [`EnvironmentKey`](/docs/recoil-relay/api/EnvironmentKey) to match with an environment pprovided by a surrounding [`<RecoilRelayEnvironment>`](/docs/recoil-relay/api/RecoilRelayEnvironment).
* **`query`** - A [GraphQL Query or Subscription](https://graphql.org/learn/queries/).
* **`variables`** - Callback to provide the [variables](https://graphql.org/learn/queries/#variables) object to use for the query.  This may be the variables object directly or a callback which is provided the famliy parameter and returns the variables.  A nested callback can also be used that gets a `get()` function that allows the selector to reference other upstream Recoil atoms/selectors.  If `null` is provided as the variables then no query will be performed and the `default` value will be used instead.
* **`mapResponse`** - Callback to transform the GraphQL results for using as the value of the selector.  It is also provided a `get()` function so it can reference other Recoil atoms/selectors to perform the transformation.  A nested callback that receives the family parameter can also be used.
* **`default`** - The default value to use if `null` is provided as the `variables`.  A callback can be used which gets the family parameter as an argument.  If `default` is not provided then the selector will remain in a pending state.
* **`mutations`** - Optional configuration of a [GraphQL Mutation](https://graphql.org/learn/queries/#mutations) and variables to commit if the selector is explicitly written to.
---

### Query with Parameter

```jsx
const eventQuery = graphQLSelectorFamily({
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
  variables: id => ({id}),
  mapResponse: data => data.myevent,
});
```
```jsx
function MyComponent(props) {
  const eventInfo = useRecoilValue(eventQuery(props.eventID));

  return (
    <div>
      <h1>{eventInfo.name}</h1>
    </div>
  );
}
```

### Query with Parameter and Upstream State
The `variables` and `mapResponse` can depend on both parameters and other upstream Recoil atoms/selectors.

```jsx
const eventQuery = graphQLSelectorFamily({
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
  variables: id => ({get}) => ({id, clientID: get(clientIDAtom)}),
  mapResponse: (data, {get}) => id => ({
    id,
    name: data.myevent?.name,
    region: get(regionForIDSelector(id)),
  }),
});
```
