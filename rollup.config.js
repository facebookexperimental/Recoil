import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';
import path from 'path';
import alias from '@rollup/plugin-alias';

let emptyModulePath = path.resolve(__dirname, 'src/util/empty.js');

function getExternals(target) {
  switch (target) {
    case 'browser':
      return ['react', 'react-dom'];
    case 'native':
      return ['react', 'react-native'];
  }
}

function getAliases(target) {
  switch (target) {
    case 'browser':
      return [{find: 'react-native', replacement: emptyModulePath}];
    case 'native':
      return [{find: 'react-dom', replacement: emptyModulePath}];
  }
}

const config = (target, mode) => ({
  input: 'src/Recoil.js',
  output: {
    file: `dist/recoil.${target}.${mode}.js`,
    format: 'cjs',
    exports: 'named',
  },
  external: getExternals(target),
  plugins: [
    alias({entries: getAliases(target)}),
    babel({
      presets: ['@babel/preset-react', '@babel/preset-flow'],
      plugins: [
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-class-properties',
      ],
      babelHelpers: 'bundled',
    }),
    nodeResolve(),
    commonjs(),
    mode === 'development' ? undefined : terser({mangle: false}),
  ],
});

export default [
  config('browser', 'development'),
  config('browser', 'production'),
  config('native', 'development'),
  config('native', 'production'),
];
