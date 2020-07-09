import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import {terser} from 'rollup-plugin-terser';

const inputFile = 'src/Recoil_index.js';
const externalLibs = ['react', 'react-dom'];

const commonPlugins = [
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
      if (source === 'ReactDOM') {
        return {id: 'react-dom', external: true};
      }
      return null;
    },
  },
  nodeResolve(),
  commonjs(),
];

const developmentPlugins = [
  ...commonPlugins,
  replace({
    'process.env.NODE_ENV': JSON.stringify('development'),
  }),
];

const productionPlugins = [
  ...commonPlugins,
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
      file: `lib/recoil.js`,
      format: 'cjs',
      exports: 'named',
    },
    external: externalLibs,
    plugins: commonPlugins,
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
    plugins: commonPlugins,
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
      file: `dist/recoil.js`,
      format: 'umd',
      name: 'Recoil',
      exports: 'named',
    },
    external: externalLibs,
    plugins: developmentPlugins,
  },

  // UMD Production
  {
    input: inputFile,
    output: {
      file: `dist/recoil.min.js`,
      format: 'umd',
      name: 'Recoil',
      exports: 'named',
    },
    external: externalLibs,
    plugins: productionPlugins,
  },
];

export default configs;
