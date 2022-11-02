/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

function sprintf(format: string, ...args: Array<mixed>): string {
  let index = 0;
  return format.replace(/%s/g, () => String(args[index++]));
}

module.exports = sprintf;
