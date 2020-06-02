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

function sprintf(format: string, ...args: Array<mixed>): string {
  let index = 0;
  return format.replace(/%s/g, () => String(args[index++]));
}

module.exports = sprintf;
