/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall recoil
 */

'use strict';

// @fb-only: const recoverableViolation = require('recoverableViolation');

const recoverableViolation = require('recoil-shared/polyfill/recoverableViolation.js'); // @oss-only

module.exports = recoverableViolation;
