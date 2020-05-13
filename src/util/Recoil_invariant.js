/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

const invariant = require('invariant'); // @fb-only

// @oss-only function invariant(condition: boolean, message: string) {
// @oss-only   if (!condition) {
// @oss-only     throw new Error(message);
// @oss-only   }
// @oss-only }

module.exports = invariant;
