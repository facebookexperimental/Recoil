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

/**
 * The someSet() method tests whether some elements in the given Set pass the
 * test implemented by the provided function.
 */
function someSet<T>(
  set: $ReadOnlySet<T>,
  callback: (value: T, key: T, set: $ReadOnlySet<T>) => boolean,
  context?: mixed,
): boolean {
  const iterator = set.entries();
  let current = iterator.next();
  while (!current.done) {
    const entry = current.value;
    if (callback.call(context, entry[1], entry[0], set)) {
      return true;
    }
    current = iterator.next();
  }
  return false;
}

module.exports = someSet;
