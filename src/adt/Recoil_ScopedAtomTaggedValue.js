/**
 * Copyright 2004-present Facebook. All Rights Reserved.
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
