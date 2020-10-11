module.exports = api => {
  const isTest = api.env('test');

  const plugins = [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          React: 'react',
          ReactDOM: 'react-dom',
          ReactNative: 'react-native',
          ReactTestUtils: 'react-dom/test-utils',
        },
      },
    ],
    'babel-preset-fbjs/plugins/dev-expression',
    '@babel/plugin-proposal-class-properties',
    '@babel/proposal-nullish-coalescing-operator',
    '@babel/proposal-optional-chaining',
    '@babel/transform-flow-strip-types',
  ];

  if (isTest) {
    // jest will need import to be converted to require statements.
    // For release, rollup will transform modules accordingly
    plugins.push('@babel/plugin-transform-modules-commonjs');
  }

  return {
    presets: ['@babel/react', '@babel/flow'],
    plugins,
  };
};
