/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @format
 */

import alias from '@rollup/plugin-alias';
import {babel} from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import path from 'path';
import {terser} from 'rollup-plugin-terser';
import {projectRootDir} from './project-root-dir.js';

const inputFile = 'packages/recoil/Recoil_index.js';
const externalLibs = ['react', 'react-dom', 'react-native'];

const defaultNodeResolveConfig = {};
const nodeResolvePlugin = nodeResolve(defaultNodeResolveConfig);

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
      if (source === 'ReactDOMLegacy_DEPRECATED') {
        return {id: 'react-dom', external: true};
      }
      if (source === 'ReactNative') {
        return {id: 'react-native', external: true};
      }
      return null;
    },
  },
  alias({
    entries: [
      {
        find: 'recoil-shared',
        replacement: path.resolve(projectRootDir, 'packages/shared'),
      },
    ],
  }),
  nodeResolvePlugin,
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

const outputFolder = 'build';
export function createOutputOption(type, filename, UMDName) {
  switch (type) {
    case 'cjs':
      return {
        file: `${outputFolder}/${filename}/cjs/${filename}.js`,
        format: 'cjs',
        exports: 'named',
      };
    case 'es':
      return {
        file: `${outputFolder}/${filename}/es/${filename}.js`,
        format: 'es',
        exports: 'named',
      };
    case 'es-browsers':
      return {
        file: `${outputFolder}/${filename}/es/${filename}.mjs`,
        format: 'es',
        exports: 'named',
      };
    case 'umd':
      return {
        file: `${outputFolder}/${filename}/umd/${filename}.js`,
        format: 'umd',
        name: UMDName,
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      };
    case 'umd-prod':
      return {
        file: `${outputFolder}/${filename}/umd/${filename}.min.js`,
        format: 'umd',
        name: UMDName,
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      };
    case 'native':
      return {
        file: `${outputFolder}/${filename}/native/${filename}.js`,
        format: 'es',
        exports: 'named',
      };
    default:
      throw new Error(`Unknown output type: ${type}`);
  }
}

export const recoilInputOptions = {
  common: {
    input: inputFile,
    external: externalLibs,
    plugins: commonPlugins,
  },
  dev: {
    input: inputFile,
    external: externalLibs,
    plugins: developmentPlugins,
  },
  prod: {
    input: inputFile,
    external: externalLibs,
    plugins: productionPlugins,
  },
  native: {
    input: inputFile,
    external: externalLibs,
    plugins: commonPlugins.map(plugin => {
      // Replace the default nodeResolve plugin
      if (plugin === nodeResolvePlugin) {
        return nodeResolve({
          ...defaultNodeResolveConfig,
          extensions: ['.native.js', '.js'],
        });
      }

      return plugin;
    }),
  },
};
