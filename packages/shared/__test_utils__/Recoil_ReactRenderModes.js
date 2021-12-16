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

let strictMode: boolean = false;

const isStrictModeEnabled = (): boolean => strictMode;

const setStrictMode = (enableStrictMode: boolean): void => {
  strictMode = enableStrictMode;
};

let concurrentMode: boolean = false;

const isConcurrentModeEnabled = (): boolean => concurrentMode;

const setConcurrentMode = (enableConcurrentMode: boolean): void => {
  concurrentMode = enableConcurrentMode;
};

module.exports = {
  isStrictModeEnabled,
  setStrictMode,
  isConcurrentModeEnabled,
  setConcurrentMode,
};
