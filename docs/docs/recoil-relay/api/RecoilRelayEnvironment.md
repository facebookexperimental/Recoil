---
title: <RecoilRelayEnvironment>
sidebar_label: <RecoilRelayEnvironment>
---

A component that registers a Relay Environment to be used by GraphQL [selectors](/docs/recoil-relay/graphql-queries) or [atom effects](/docs/recoil-relay/graphql-effects) referenced by its child components with matching [`EnvironmentKey`](/docs/recoil-relay/api/EnvironmentKey).

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
      <RecoilRelayEnvironment
        environment={myEnvironemnt}
        environmentKey={myEnvironmentKey}>
        {/** My App **/}
      </RecoilRelayEnvironment>
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
