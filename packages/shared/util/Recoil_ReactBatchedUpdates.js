/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 *
 * This is to export esstiential functions from react-dom
 * for our web build
 */

// @fb-only: const {unstable_batchedUpdates} = require('ReactDOMComet');

// prettier-ignore
const {unstable_batchedUpdates} = require('recoil-shared/polyfill/ReactBatchedUpdates'); // @oss-only

module.exports = {unstable_batchedUpdates};
