/**
 * Copyright 2015-present Facebook. All Rights Reserved.
 *
 * @flow strict
 * @format
 * @typechecks
 */

'use strict';

/**
 * Returns a new Array containing all the element of the source array except
 * `null` and `undefined` ones. This brings the benefit of strong typing over
 * `Array.prototype.filter`.
 */
export default function compactArray<T>(array: $ReadOnlyArray<?T>): Array<T> {
  const result = [];
  for (let i = 0; i < array.length; ++i) {
    const elem = array[i];
    if (elem != null) {
      result.push(elem);
    }
  }
  return result;
}
