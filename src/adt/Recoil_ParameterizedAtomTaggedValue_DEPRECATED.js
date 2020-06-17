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

export type Entries<T> = Array<[Set<string>, Map<string, T>]>;

class ParameterizedAtomTaggedValue_DEPRECATED<T> {
  value: Entries<T>;
  constructor(value: Entries<T>) {
    this.value = value;
  }
}

module.exports = ParameterizedAtomTaggedValue_DEPRECATED;
