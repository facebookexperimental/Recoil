---
title: EnvironmentKey
sidebar_label: EnvironmentKey
---

An `EnvironmentKey` is class that can be used to match up a Relay Environment registered with [`<RecoilRelayEnvironment>`](/docs/recoil-relay/api/RecoilRelayEnvironment) in your [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot) with a GraphQL [selector](/docs/recoil-relay/graphql-selectors) or [atom effect](/docs/recoil-relay/graphql-effects) that uses it to query.

```jsx
const myEnvironmentKey = new EnvironmentKey('My Environment');
```

Using an `EnvironmentKey` to register Relay Environments instead of just specifying the Relay Environment direclty in the query can be useful if the environment is only known at render time.
