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

// @fb-only: const recoverableViolation = require('recoverableViolation');

// prettier-ignore
/* eslint-disable no-lone-blocks */
// this {} block is necessary to keep prettier off on internal repo
// @fb-only: {
function recoverableViolation( // @oss-only
  message: string, // @oss-only
  projectName: 'recoil', // @oss-only
  {error}: {|error?: Error|} = {}, // @oss-only
): null { // @oss-only
  if (__DEV__) { // @oss-only
    console.error(message, error); // @oss-only
  } // @oss-only
  return null; // @oss-only
} // @oss-only
// @fb-only: }
/* eslint-enable no-lone-blocks */

module.exports = recoverableViolation;
