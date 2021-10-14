/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */
'use strict';

// @fb-only: const {err} = require('fb-error');

const err = require('./polyfill/err.js'); // @oss-only

module.exports = err;
