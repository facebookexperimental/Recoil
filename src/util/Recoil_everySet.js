/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * The everySet() method tests whether all elements in the given Set pass the
 * test implemented by the provided function.
 */
function everySet<T>(
  set: $ReadOnlySet<T>,
  callback: (value: T, key: T, set: $ReadOnlySet<T>) => boolean,
  context?: mixed,
): boolean {
  const iterator = set.entries();
  let current = iterator.next();
  while (!current.done) {
    const entry = current.value;
    if (!callback.call(context, entry[1], entry[0], set)) {
      return false;
    }
    current = iterator.next();
  }
  return true;
}

module.exports = everySet;
