'use strict';

// this file will be added to the root after build
// he allows users to require utils package as:
// import { atomFamily } from 'recoil/utils'

module.exports = require('./dist/utils/index.js');
