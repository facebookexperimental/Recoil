import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import {terser} from 'rollup-plugin-terser';

const config = ({mode, target}) => ({
  input: 'src/Recoil_index.js',
  output: {
    file:
      target === 'web'
        ? `dist/recoil.${mode}.js`
        : `dist/recoil.${mode}.${target}.js`,
    format: 'cjs',
    exports: 'named',
  },
  external: ['react', 'react-dom', 'react-native'],
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
        if (source === 'ReactNative') {
          return {id: 'react-native', external: true};
        }
        return null;
      },
    },
    nodeResolve({
      extensions: target === 'native' ? ['.native.js', '.js'] : undefined,
    }),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(mode),
    }),
    mode === 'development' ? undefined : terser({mangle: false}),
  ],
});

export default [
  config({mode: 'development', target: 'web'}),
  config({mode: 'production', target: 'web'}),
  config({mode: 'development', target: 'native'}),
  config({mode: 'production', target: 'native'}),
];
