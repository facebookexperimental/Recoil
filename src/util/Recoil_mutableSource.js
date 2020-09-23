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

const React = require('React');

// FIXME T2710559282599660
const useMutableSource: Function = // flowlint-line unclear-type:off
  (React: any).useMutableSource ?? (React: any).unstable_useMutableSource; // flowlint-line unclear-type:off

function mutableSourceExists(): boolean {
  return (
    useMutableSource &&
    !(
      typeof window !== 'undefined' &&
      window.$disableRecoilValueMutableSource_TEMP_HACK_DO_NOT_USE
    )
  );
}

module.exports = {
  mutableSourceExists,
  useMutableSource,
};
