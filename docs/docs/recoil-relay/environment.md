---
title: Relay Environment
sidebar_label: Relay Environment
---

The first step for using the `recoil-relay` library is to register your Relay environment(s).  Each GraphQL [selector](/docs/recoil-relay/graphql_selectors) or [effect](/docs/recoil-relay/graphql_effects) requires an `environment` option which can either be a Relay Environment directly, or an **`EnvironmentKey`**.

### `EnvironmentKey`

When using a **`EnvironmentKey`** with your GraphQL queries it matches up with a surrounding **`<RecoilRelayEnvironment>`** with the same `environmentKey` within your `<RecoilRoot>`.  This is helpful in case the environment object is only available at runtime when actually rendering your component, such as for [preloaded queries](/docs/recoil-relay/preloaded_queries).

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

To use the Relay API, such as for committing mutations, with your environment the `<RelayEnvironmentProvider>` component is still required.  For your convenience there is a **`<RecoilRelayEnvrironmentProvider>`** component which combines both `<RecoilRelayEnvironment>` and `<RelayEnvironmentProvider>`.

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
