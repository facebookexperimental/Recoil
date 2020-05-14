/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
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
