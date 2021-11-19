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

// Object.fromEntries() is not available in GitHub's version of Node.js (9/21/2021)
function objectFromEntries<T>(entries: Iterable<[string, T]>): {
  [string]: T,
} {
  const obj = {};
  for (const [key, value] of entries) {
    obj[key] = value;
  }
  return obj;
}

module.exports = objectFromEntries;
