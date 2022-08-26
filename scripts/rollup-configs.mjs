/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall recoil
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
  'relay-runtime',
  'react-relay',
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

const nativePlugins = commonPlugins.map(plugin =>
  // Replace the default nodeResolvePlugin
  plugin !== nodeResolvePlugin ? plugin :
    nodeResolve({
      ...defaultNodeResolveConfig,
      extensions: ['.native.js', '.js'],
    })
);

export function createInputOption(buildType, folder, inputFile) {
  switch (buildType) {
    case 'common':
      return {
        input: `packages/${folder}/${inputFile}`,
        external: externalLibs,
        plugins: commonPlugins,
      };
    case 'dev':
      return {
        input: `packages/${folder}/${inputFile}`,
        external: externalLibs,
        plugins: developmentPlugins,
        };
    case 'prod':
      return {
        input: `packages/${folder}/${inputFile}`,
        external: externalLibs,
        plugins: productionPlugins,
        };
    case 'native':
      return {
        input: `packages/${folder}/${inputFile}`,
        external: externalLibs,
        plugins: nativePlugins,
        };
    default:
      throw new Error(`Unknown input type: ${buildType}`);
  }
}

const BUILD_TARGET = 'build';

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  recoil: 'Recoil',
  'transit-js': 'transit',
  'relay-runtime': 'relay-runtime',
  'react-relay': 'react-relay',
};

export function createOutputOption(packageType, folder, UMDName) {
  switch (packageType) {
    case 'cjs':
      return {
        file: `${BUILD_TARGET}/${folder}/cjs/index.js`,
        format: 'cjs',
        exports: 'named',
      };
    case 'es':
      return {
        file: `${BUILD_TARGET}/${folder}/es/index.js`,
        format: 'es',
        exports: 'named',
      };
    case 'es-browsers':
      return {
        file: `${BUILD_TARGET}/${folder}/es/index.mjs`,
        format: 'es',
        exports: 'named',
      };
    case 'umd':
      return {
        file: `${BUILD_TARGET}/${folder}/umd/index.js`,
        format: 'umd',
        name: UMDName,
        exports: 'named',
        globals,
      };
    case 'umd-prod':
      return {
        file: `${BUILD_TARGET}/${folder}/umd/index.min.js`,
        format: 'umd',
        name: UMDName,
        exports: 'named',
        globals,
      };
    case 'native':
      return {
        file: `${BUILD_TARGET}/${folder}/native/index.js`,
        format: 'es',
        exports: 'named',
      };
    default:
      throw new Error(`Unknown output type: ${packageType}`);
  }
}
