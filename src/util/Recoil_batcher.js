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

// Allow injecting another batching function later
const setBatcher = (newBatcher: Batcher) => (batcher = newBatcher);

const batchUpdates = (callback: Callback) => batcher(callback);

module.exports = {
  setBatcher,
  batchUpdates,
};
