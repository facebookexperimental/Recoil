module.exports = {
  // Configuration options accepted by the `relay-compiler` command-line tool and `babel-plugin-relay`.
  src: './packages/recoil-relay/__tests__',
  schema: './packages/recoil-relay/__tests__/mock-graphql/schema.graphql',
  exclude: ['**/node_modules/**', '**/__mocks__/**', '**/__generated__/**'],
}
