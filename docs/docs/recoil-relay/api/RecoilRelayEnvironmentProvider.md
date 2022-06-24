---
title: <RecoilRelayEnvironmentProvider>
sidebar_label: <RecoilRelayEnvironmentProvider>
---

The [`<RecoilRelayEnvironment>`](/docs/recoil-relay/api/RecoilRelayEnvironment) component enables you to use a Relay Environment with Recoil GraphQL [selectors](/docs/recoil-relay/graphql-queries) or [atom effects](/docs/recoil-relay/graphql-effects) in its child components.  The [`<RelayEnvironmentProvider>`](https://relay.dev/docs/api-reference/relay-environment-provider) component enables you to use a Relay Environment with Relay hooks in its child components.  **`<RecoilRelayEnvironmentProvider>`** is simply a convenience component which combines these two.

---
### Props
* **`environment`** - The Relay Environment object to register.
* **`environmentKey`** - The [`EnvironmentKey`](/docs/recoil-relay/api/EnvironmentKey) object to associate this environment with.
---

### Example
```jsx
const myEnvironmentKey = new EnvironmentKey('My Environment');

function MyApp() {
  return (
    <RecoilRoot>
      <RecoilRelayEnvironmentProvider
        environment={myEnvironemnt}
        environmentKey={myEnvironmentKey}>
        {/** My App **/}
      </RecoilRelayEnvironmentProvider>
    </RecoilRoot>
  )
}
```
```jsx
const myQuery = graphQLSelector({
  key: 'MyQuery',
  environment: myEnvironmentKey,
  query: graphql`...`,
  variables: {},
});

function MyComponent() {
  const results = useRecoilValue(myQuery);
}
```
