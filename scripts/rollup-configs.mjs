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
import {projectRootDir} from './project-root-dir.mjs';

const externalLibs = [
  'react',
  'react-dom',
  'react-native',
  'recoil',
  'transit-js',
];

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
      if (source === 'Recoil') {
        return {id: 'recoil', external: true};
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
      // temporarily bundle refine into recoil-sync
      {
        find: 'refine',
        replacement: path.resolve(
          projectRootDir,
          'packages/refine/Refine_index.js',
        ),
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
const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  recoil: 'Recoil',
  'transit-js': 'transit',
};
export function createOutputOption(type, folder, filename, UMDName) {
  switch (type) {
    case 'cjs':
      return {
        file: `${outputFolder}/${folder}/cjs/${filename}.js`,
        format: 'cjs',
        exports: 'named',
      };
    case 'es':
      return {
        file: `${outputFolder}/${folder}/es/${filename}.js`,
        format: 'es',
        exports: 'named',
      };
    case 'es-browsers':
      return {
        file: `${outputFolder}/${folder}/es/${filename}.mjs`,
        format: 'es',
        exports: 'named',
      };
    case 'umd':
      return {
        file: `${outputFolder}/${folder}/umd/${filename}.js`,
        format: 'umd',
        name: UMDName,
        exports: 'named',
        globals,
      };
    case 'umd-prod':
      return {
        file: `${outputFolder}/${folder}/umd/${filename}.min.js`,
        format: 'umd',
        name: UMDName,
        exports: 'named',
        globals,
      };
    case 'native':
      return {
        file: `${outputFolder}/${folder}/native/${filename}.js`,
        format: 'es',
        exports: 'named',
      };
    default:
      throw new Error(`Unknown output type: ${type}`);
  }
}

const recoilInputFile = 'packages/recoil/Recoil_index.js';
export const recoilInputOptions = {
  common: {
    input: recoilInputFile,
    external: externalLibs,
    plugins: commonPlugins,
  },
  dev: {
    input: recoilInputFile,
    external: externalLibs,
    plugins: developmentPlugins,
  },
  prod: {
    input: recoilInputFile,
    external: externalLibs,
    plugins: productionPlugins,
  },
  native: {
    input: recoilInputFile,
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

const recoilSyncInputFile = 'packages/recoil-sync/RecoilSync_index.js';
export const recoilSyncInputOptions = {
  common: {
    input: recoilSyncInputFile,
    external: externalLibs,
    plugins: commonPlugins,
  },
  dev: {
    input: recoilSyncInputFile,
    external: externalLibs,
    plugins: developmentPlugins,
  },
  prod: {
    input: recoilSyncInputFile,
    external: externalLibs,
    plugins: productionPlugins,
  },
};
