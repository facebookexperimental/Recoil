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

export const isStrictModeEnabled = (): boolean => strictMode;

export const setStrictMode = (enableStrictMode: boolean): void => {
  strictMode = enableStrictMode;
};

let concurrentMode: boolean = false;

export const isConcurrentModeEnabled = (): boolean => concurrentMode;

export const setConcurrentMode = (enableConcurrentMode: boolean): void => {
  concurrentMode = enableConcurrentMode;
};
