---
title: Relay Environment
sidebar_label: Relay Environment
---

To use GraphQL with the `recoil-relay` library you'll need to reference your Relay environment(s).  Each GraphQL [selector](/docs/recoil-relay/graphql-selectors) or [effect](/docs/recoil-relay/graphql-effects) requires an `environment` option which can either reference a Relay Environment directly or be an [**`EnvironmentKey`**](/docs/recoil-relay/api/EnvironmentKey) that matches up with a [**`<RecoilRelayEnvironment>`**](/docs/recoil-relay/api/RecoilRelayEnvironment) compnoent that registered a Relay environment.

### `EnvironmentKey`

When using an [**`EnvironmentKey`**](/docs/recoil-relay/api/EnvironmentKey) with your GraphQL queries it is matched up with a surrounding [**`<RecoilRelayEnvironment>`**](/docs/recoil-relay/api/RecoilRelayEnvironment) with the same `environmentKey` within your [`<RecoilRoot>`](/docs/api-reference/core/RecoilRoot).  This is useful in case the environment object is only available at runtime when actually rendering your component, such as for [preloaded queries](/docs/recoil-relay/preloaded_queries).

```jsx
const myEnvironmentKey = new EnvironmentKey('My Environment');

function MyApp() {
  const myEnvironment = useMyRelayEnvironment();
  return (
    <RecoilRoot>
      <RecoilRelayEnvironment
        environment={myEnvironment}
        environmentKey={myEnvironmentKey}>
        {/* Components here can use Recoil atoms/selectors which reference myEnvironmentKey */}
      </RecoilRelayEnvironment>
    </RecoilRoot>
  )
}
```

### Environment Provider

To use Relay hooks, such as for committing mutations, with your environment the [`<RelayEnvironmentProvider>`](https://relay.dev/docs/api-reference/relay-environment-provider) component is still required.  For your convenience there is a [**`<RecoilRelayEnvrironmentProvider>`**](/docs/recoil-relay/api/RecoilRelayEnvironmentProvider) component which combines both [`<RecoilRelayEnvironment>`](/docs/recoil-relay/api/RecoilRelayEnvironment) and [`<RelayEnvironmentProvider>`](https://relay.dev/docs/api-reference/relay-environment-provider).

```jsx
const myEnvironmentKey = new EnvironmentKey('My Environment');

function MyApp() {
  return (
    <RecoilRoot>
      <RecoilRelayEnvironmentProvider
        environment={myEnvironment}
        environmentKey={myEnvironmentKey}>
        {/* Components here can use both Recoil and Relay APIs for GraphQL */}
      </RecoilRelayEnvironmentProvider>
    </RecoilRoot>
  )
}
```
