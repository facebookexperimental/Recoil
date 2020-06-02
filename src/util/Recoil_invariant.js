/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

// @fb-only: const invariant = require('invariant');

// prettier-ignore
function invariant(condition: boolean, message: string) { // @oss-only
  if (!condition) { // @oss-only
    throw new Error(message); // @oss-only
  } // @oss-only
} // @oss-only

module.exports = invariant;
