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

import {batchStart} from '../core/Recoil_RecoilValueInterface';
import {unstable_batchedUpdates} from 'recoil-shared/util/Recoil_ReactBatchedUpdates';

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
export const setBatcher: Batcher => void = (newBatcher: Batcher) => {
  batcher = newBatcher;
};

/**
 * Returns the current batcher function.
 */
export const getBatcher: () => Batcher = () => batcher;

/**
 * Calls the current batcher function and passes the
 * provided callback function.
 */
export const batchUpdates: Callback => void = (callback: Callback) => {
  batcher(() => {
    let batchEnd = () => undefined;
    try {
      batchEnd = batchStart();
      callback();
    } finally {
      batchEnd();
    }
  });
};
