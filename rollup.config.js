import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import {terser} from 'rollup-plugin-terser';

const inputFile = 'src/Recoil_index.js';
const externalLibs = ['react', 'react-dom'];

const getCommonPlugins = ({renderer = 'react-dom'} = {}) => [
  babel({
    presets: ['@babel/preset-react', '@babel/preset-flow'],
    plugins: [
      'babel-preset-fbjs/plugins/dev-expression',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/transform-flow-strip-types',
    ],
    babelHelpers: 'bundled',
  }),
  {
    resolveId: source => {
      if (source === 'React') {
        return {id: 'react', external: true};
      }
      if (source === 'ReactRenderer') {
        return {id: renderer, external: true};
      }
      return null;
    },
  },
  nodeResolve({}),
  commonjs(),
];

const commonPluginsDOM = getCommonPlugins();

const developmentPlugins = [
  ...commonPluginsDOM,
  replace({
    'process.env.NODE_ENV': JSON.stringify('development'),
  }),
];

const productionPlugins = [
  ...commonPluginsDOM,
  replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  terser({mangle: false}),
];

const configs = [
  // CommonJS
  {
    input: inputFile,
    output: {
      file: `cjs/recoil.js`,
      format: 'cjs',
      exports: 'named',
    },
    external: externalLibs,
    plugins: commonPluginsDOM,
  },

  // ES
  {
    input: inputFile,
    output: {
      file: `es/recoil.js`,
      format: 'es',
      exports: 'named',
    },
    external: externalLibs,
    plugins: commonPluginsDOM,
  },

  // React Native
  {
    input: inputFile,
    output: {
      file: `native/recoil.js`,
      format: 'es',
      exports: 'named',
    },
    external: [...externalLibs, 'react-native'],
    plugins: getCommonPlugins({renderer: 'react-native'}),
  },

  // ES for Browsers
  {
    input: inputFile,
    output: {
      file: `es/recoil.mjs`,
      format: 'es',
      exports: 'named',
    },
    external: externalLibs,
    plugins: productionPlugins,
  },

  // UMD Development
  {
    input: inputFile,
    output: {
      file: `umd/recoil.js`,
      format: 'umd',
      name: 'Recoil',
      exports: 'named',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
    external: externalLibs,
    plugins: developmentPlugins,
  },

  // UMD Production
  {
    input: inputFile,
    output: {
      file: `umd/recoil.min.js`,
      format: 'umd',
      name: 'Recoil',
      exports: 'named',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
    external: externalLibs,
    plugins: productionPlugins,
  },
];

export default configs;
