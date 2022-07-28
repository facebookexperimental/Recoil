/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall recoil
 */
'use strict';

const err = require('./Recoil_err');

function nullthrows<T>(x: ?T, message: ?string): T {
  if (x != null) {
    return x;
  }
  throw err(message ?? 'Got unexpected null or undefined');
}

module.exports = nullthrows;
