/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall recoil
 */
'use strict';

const gks = new Map()
  .set('recoil_hamt_2020', true)
  .set('recoil_sync_external_store', true)
  .set('recoil_suppress_rerender_in_callback', true)
  .set('recoil_memory_managament_2020', true);

function Recoil_gkx_OSS(gk: string): boolean {
  return gks.get(gk) ?? false;
}

Recoil_gkx_OSS.setPass = (gk: string): void => {
  gks.set(gk, true);
};

Recoil_gkx_OSS.setFail = (gk: string): void => {
  gks.set(gk, false);
};

Recoil_gkx_OSS.clear = (): void => {
  gks.clear();
};

module.exports = Recoil_gkx_OSS; // @oss-only

// @fb-only: module.exports = require('gkx');
