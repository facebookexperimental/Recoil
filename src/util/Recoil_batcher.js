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
 * This is a stub for some integration into FB internal stuff
 */

const {unstable_batchedUpdates} = require('./Recoil_ReactBatchedUpdates');

let batcher = unstable_batchedUpdates;

// flowlint-next-line unclear-type:off
type Callback = () => any;
type Batcher = (callback: Callback) => void;

/**
 * Sets the provided batcher function as the batcher function used by Recoil.
 *
 * Set the batcher to a custom batcher for your renderer,
 * if you use a renderer other than React DOM or React Native.
 */
const setBatcher = (newBatcher: Batcher) => (batcher = newBatcher);

/**
 * Returns the current batcher function.
 */
const getBatcher = () => batcher;

/**
 * Calls the current batcher function and passes the
 * provided callback function.
 */
const batchUpdates = (callback: Callback) => batcher(callback);

module.exports = {
  getBatcher,
  setBatcher,
  batchUpdates,
};
