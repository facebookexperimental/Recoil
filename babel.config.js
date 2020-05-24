module.exports = {
  presets: ['@babel/react'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          React: 'react',
          ReactDOM: 'react-dom',
          ReactTestUtils: 'react-dom/test-utils',
        },
      },
    ],
    '@babel/proposal-nullish-coalescing-operator',
    '@babel/proposal-optional-chaining',
    '@babel/transform-flow-strip-types',
  ],
};
