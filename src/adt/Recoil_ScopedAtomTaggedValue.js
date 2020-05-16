/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

import type ArrayKeyedMap from 'Recoil_ArrayKeyedMap';

export type ScopeMap<T> = ArrayKeyedMap<T>;

export type ScopedValue<T> = $ReadOnlyArray<[number, ScopeMap<T>]>;

class ScopedAtomTaggedValue<T> {
  entries: ScopedValue<T>;
  constructor(entries: ScopedValue<T>) {
    this.entries = entries;
  }
}

module.exports = ScopedAtomTaggedValue;
