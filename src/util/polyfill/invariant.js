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

function invariant(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

module.exports = invariant;
