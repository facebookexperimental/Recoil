// rollup.config.js
import nodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
//import includePaths from 'rollup-plugin-includepaths';

const includePathOptions = {
  include: {},
  paths: [
    'src/adt',
    'src/core',
    'src/util',
    'src/components',
    'src/recoil_values',
    'src/hooks',
    'src/caches',
  ],
  external: [],
  extensions: ['.js'],
};

export default {
  input: 'src/Recoil.js',
  output: {
    file: 'recoil.js',
    format: 'cjs',
  },
  plugins: [
    babel(),
    nodeResolve(),
    commonjs(),
    //    includePaths(includePathOptions),
  ],
};
