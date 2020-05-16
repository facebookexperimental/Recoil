/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+perf_viz
 * @flow strict
 * @format
 */

'use strict';

function nullthrows<T>(x: ?T, message: ?string): T {
  if (x != null) {
    return x;
  }
  throw new Error(message ?? 'Got unexpected null or undefined');
}

module.exports = nullthrows;
