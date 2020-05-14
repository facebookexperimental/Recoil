import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from "rollup-plugin-terser";

export default {
  input: 'src/Recoil.js',
  output: {
    file: 'recoil.js',
    format: 'cjs',
  },
  external: ['react', 'react-dom'],
  plugins: [
    babel({
      "presets": [
        "@babel/preset-react",
        "@babel/preset-flow"
      ],
      "plugins": [
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-class-properties'
      ]
    }),
    {
      resolveId: (source) => {
        if (source === 'React') {
          return {id: 'react', external: true};
        }
        if (source === 'ReactDOM') {
          return {id: 'react-dom', external: true};
        }
        return null;
      }
    },
    nodeResolve(),
    commonjs(),
    terser(),
  ],
};
