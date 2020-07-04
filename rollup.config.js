import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import {terser} from 'rollup-plugin-terser';

const configs = [
  // CommonJS
  {
    input: 'src/Recoil_index.js',
    output: {
      file: `lib/recoil.js`,
      format: 'cjs',
      exports: 'named',
    },
    external: ['react', 'react-dom'],
    plugins: [
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
    ],
  },

  // ES
  {
    input: 'src/Recoil_index.js',
    output: {
      file: `es/recoil.js`,
      format: 'es',
      exports: 'named',
    },
    external: ['react', 'react-dom'],
    plugins: [
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
    ],
  },

  // ES for Browsers
  {
    input: 'src/Recoil_index.js',
    output: {
      file: `es/recoil.mjs`,
      format: 'es',
      exports: 'named',
    },
    external: ['react', 'react-dom'],
    plugins: [
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
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      terser({mangle: false}),
    ],
  },

  // UMD Development
  {
    input: 'src/Recoil_index.js',
    output: {
      file: `dist/recoil.js`,
      format: 'umd',
      name: 'Recoil',
      exports: 'named',
    },
    external: ['react', 'react-dom'],
    plugins: [
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
      replace({
        'process.env.NODE_ENV': JSON.stringify('development'),
      }),
    ],
  },

  // UMD Production
  {
    input: 'src/Recoil_index.js',
    output: {
      file: `dist/recoil.min.js`,
      format: 'umd',
      name: 'Recoil',
      exports: 'named',
    },
    external: ['react', 'react-dom'],
    plugins: [
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
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      terser({mangle: false}),
    ],
  },
];

export default configs;
