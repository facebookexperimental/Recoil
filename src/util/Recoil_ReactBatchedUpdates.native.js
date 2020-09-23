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
 * This is to export esstiential functions from react-native
 * for our react-native build (currently only available on github)
 */

// $FlowExpectedError[cannot-resolve-module] // @oss-only
const {unstable_batchedUpdates} = require('ReactNative'); // @oss-only
module.exports = {unstable_batchedUpdates}; // @oss-only
