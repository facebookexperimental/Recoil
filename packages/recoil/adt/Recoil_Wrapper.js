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

class WrappedValue<T> {
  value: T;
  constructor(value: T) {
    this.value = value;
  }
}

module.exports = {
  WrappedValue,
};
