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

const everySet = require('./Recoil_everySet');

/**
 * Checks if two sets are equal
 */
function equalsSet<T>(one: $ReadOnlySet<T>, two: $ReadOnlySet<T>): boolean {
  if (one.size !== two.size) {
    return false;
  }
  return everySet(one, value => two.has(value));
}

module.exports = equalsSet;
