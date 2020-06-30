/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @format
 */
/* eslint-disable */

'use strict';

if (process.env.NODE_ENV === 'production') { // @oss-only
  module.exports = require('./recoil.production.js'); // @oss-only
} else { // @oss-only
  module.exports = require('./recoil.development.js'); // @oss-only
} // @oss-only
