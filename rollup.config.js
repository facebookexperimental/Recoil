import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';

const getPlugins = mode => [
  babel({
    presets: ['@babel/preset-react', '@babel/preset-flow'],
    plugins: [
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-class-properties',
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
  mode === 'development' ? undefined : terser({mangle: false}),
];

const external = ['react', 'react-dom'];

const config = mode => [
  {
    input: 'src/Recoil.js',
    output: {
      file: `dist/recoil.${mode}.js`,
      format: 'cjs',
      exports: 'named',
    },
    external,
    plugins: getPlugins(mode),
  },
  {
    input: 'src/RecoilUtils.js',
    output: {
      file: 'dist/utils/index.js',
      format: 'cjs',
      exports: 'named',
    },
    external,
    plugins: getPlugins(mode),
  },
];

export default [...config('development'), ...config('production')];
