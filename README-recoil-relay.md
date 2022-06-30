# Recoil Relay &middot; [![NPM Version](https://img.shields.io/npm/v/recoil-relay)](https://www.npmjs.com/package/recoil-relay) [![Node.js CI](https://github.com/facebookexperimental/Recoil/workflows/Node.js%20CI/badge.svg)](https://github.com/facebookexperimental/Recoil/actions) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebookexperimental/Recoil/blob/main/LICENSE) [![Follow on Twitter](https://img.shields.io/twitter/follow/recoiljs?label=Follow%20Recoil&style=social)](https://twitter.com/recoiljs)

The `recoil-relay` library helps [Recoil](https://recoiljs.org) perform type safe and efficient queries using [GraphQL](https://graphql.org/) with the [Relay](https://relay.dev) library.

Please see the [**Recoil Relay GraphQL Documentation**](https://recoiljs.org/docs/recoil-relay/introduction)

`recoil-relay` provides `graphQLSelector()` and `graphQLSelectorFamily()` selectors which can easily query with GraphQL.  The queries are synced with the Recoil data-flow graph so downstream selectors can derive state from them, they can depend on upstream Recoil state, and they are automatically subscribed to any changes in the graph from Relay.  Everything stays in sync automatically.

## Example
After setting up your Relay environment adding a GraphQL query is as simple as defining a [GraphQL selector](https://recoiljs.org/docs/recoil-relay/graphql-selectors).

```jsx
const userNameQuery = graphQLSelector({
  key: 'UserName',
  environment: myEnvironment,
  query: graphql`
    query UserQuery($id: ID!) {
      user(id: $id) {
        name
      }
    }
  `,
  variables: ({get}) => ({id: get(currentIDAtom)}),
  mapResponse: data => data.user?.name,
});
```
Then use it like any other Recoil [selector](https://recoiljs.org/docs/api-reference/core/selector):
```jsx
function MyComponent() {
  const userName = useRecoilValue(userNameQuery);
  return <span>{userName}</span>;
}
```

## Installation

Please see the [Recoil installation guide](https://recoiljs.org/docs/introduction/installation) for installing Recoil and the [Relay documentation](https://relay.dev/docs/getting-started/installation-and-setup/) for installing and setting up the Relay library, GraphQL compiler, Babel plugin, and ESLint plugin.  Then add `recoil-relay` as a dependency.

## Contributing

Development of Recoil happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving Recoil.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

Recoil is [MIT licensed](./LICENSE).
