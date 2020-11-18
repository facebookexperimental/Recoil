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
 * This is to export esstiential functions from a react renderer,
 * such as react-dom or react-native
 */

// in OSS it's configured in rollup.config.js
const {unstable_batchedUpdates} = require('ReactRenderer'); // @oss-only
// in FB, ReactDOMComet falls back to ReactDOM in non-comet environment
// @fb-only: const {unstable_batchedUpdates} = require('ReactDOMComet');

module.exports = {unstable_batchedUpdates};
