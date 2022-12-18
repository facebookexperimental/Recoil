/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall recoil
 */

'use strict';

const RecoilEnv = require('./Recoil_RecoilEnv');

function Recoil_gkx_OSS(gk: string): boolean {
  return RecoilEnv.RECOIL_GKS_ENABLED.has(gk);
}

Recoil_gkx_OSS.setPass = (gk: string): void => {
  RecoilEnv.RECOIL_GKS_ENABLED.add(gk);
};

Recoil_gkx_OSS.setFail = (gk: string): void => {
  RecoilEnv.RECOIL_GKS_ENABLED.delete(gk);
};

Recoil_gkx_OSS.clear = (): void => {
  RecoilEnv.RECOIL_GKS_ENABLED.clear();
};

module.exports = Recoil_gkx_OSS; // @oss-only

// @fb-only: module.exports = require('gkx');
