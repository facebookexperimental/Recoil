/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall recoil
 */

'use strict';

function recoverableViolation(
  message: string,
  _projectName: 'recoil',
  {error}: {error?: Error} = {},
): null {
  if (__DEV__) {
    console.error(message, error);
  }
  return null;
}

module.exports = recoverableViolation;
