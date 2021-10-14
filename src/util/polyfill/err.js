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

function err(message: string): Error {
  const error = new Error(message);

  // In V8, Error objects keep the closure scope chain alive until the
  // err.stack property is accessed.
  if (error.stack === undefined) {
    // IE sets the stack only if error is thrown
    try {
      throw error;
      // TODO, disable fb-www/no-unused-catch-bindings after bumping package.json to eslint-plugin-fb-www 1.0.7
    } catch (_) {} // eslint-disable-line no-empty
  }

  return error;
}

module.exports = err;
