/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

function recoverableViolation(
  message: string,
  projectName: 'recoil',
  {error}: {|error?: Error|},
): null {
  //  if (__DEV__) {
  //    console.error(message, error);
  //  }
  return null;
}

module.exports = recoverableViolation;
