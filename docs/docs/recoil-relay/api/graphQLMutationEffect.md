---
title: graphQLMutationEffect()
sidebar_label: graphQLMutationEffect()
---

The underlying [atom effect](/docs/guides/atom-effects) for causing a local update to an atom to iniate commiting a mutation to the server.

Note that if an atom has multiple atom effects which update its value then the other effects may cause `graphQLMutationEffect()` to initiate a server mutation.  So, care should be taken if trying to combine with [`graphQLQueryEffect()`](/docs/recoil-relay/api/graphQLQueryEffect).  If that is desired it may be easier to use [`graphQLSelector()`](/docs/recoil-relay/api/graphQLSelector) instead.

---

```jsx
function graphQLMutationEffect<
  TVariables: Variables,
  T,
  TResponse: $ReadOnly<{[string]: mixed}> = {},
  TRawResponse = void,
>({
  environment: IEnvironment | EnvironmentKey,
  mutation: Mutation<TVariables, TResponse, TRawResponse>,
  variables: T => null | TVariables,

  updater?: SelectorStoreUpdater<TResponse>,
  optimisticUpdater?: SelectorStoreUpdater<TResponse>,
  optimisticResponse?: TResponse,
  uploadables?: UploadableMap,
}): AtomEffect<T>
```

- `environment`: The Relay Environment or an [`EnvironmentKey`](/docs/recoil-relay/api/EnvironmentKey) to match with the environment provided with [`<RecoilRelayEnvironemnt>`](/docs/recoil-relay/api/RecoilRelayEnvironment).
- `mutation`: The GraphQL mutation.
- `variables`: Callback provided the new atom value that returns the variables object provided as input to the GraphQL mutation.  If it returns `null` then the mutation is skipped.
- `updater`: Optional `updater()` function passed to `commitMutation()`.
- `optimisticUpdater`: Optional `optimisticUpdater()` function passed to `commitMutation()`.
- `optimisticResponse`: Optional optimistic response passed to `commitMutation()`.
- `uploadables`: Optional `uploadables` passed to `commitMutation()`.

---
