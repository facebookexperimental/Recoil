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

// @fb-only: const expectationViolation = require('expectationViolation');

// The {} blocks are necessary to keep prettier off on internal repo
/* eslint-disable no-lone-blocks */

// prettier-ignore
function sprintf(format: string, ...args: Array<mixed>): string { // @oss-only
// @fb-only: {
  let index = 0; // @oss-only
  return format.replace(/%s/g, () => String(args[index++])); // @oss-only
// @fb-only: }
} // @oss-only

// prettier-ignore
const sprintf = require('./Recoil_sprintf'); // @oss-only
function expectationViolation(format: string, ...args: $ReadOnlyArray<mixed>) { // @oss-only
// @fb-only: {
  if (__DEV__) { // @oss-only
  // @fb-only: {
    const message = sprintf.call(null, format, ...args); // @oss-only
    const error = new Error(message); // @oss-only
    error.name = 'Expectation Violation'; // @oss-only
    console.error(error); // @oss-only
  // @fb-only: }
  } // @oss-only
// @fb-only: }
} // @oss-only

/* eslint-enable no-lone-blocks */

module.exports = expectationViolation;
