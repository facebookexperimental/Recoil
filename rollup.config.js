import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';

const config = ({mode, target}) => ({
  input: 'src/Recoil.js',
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
    mode === 'development' ? undefined : terser({mangle: false}),
  ],
});

export default [
  config({mode: 'development', target: 'web'}),
  config({mode: 'production', target: 'web'}),
  config({mode: 'development', target: 'native'}),
  config({mode: 'production', target: 'native'}),
];
