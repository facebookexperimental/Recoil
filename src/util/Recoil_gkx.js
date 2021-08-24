/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */
'use strict';

const {mutableSourceExists} = require('./Recoil_mutableSource');

const gks = new Map()
  .set('recoil_hamt_2020', true)
  .set('recoil_memory_managament_2020', true)
  .set('recoil_suppress_rerender_in_callback', true);

function Recoil_gkx(gk: string): boolean {
  if (gk === 'recoil_early_rendering_2021' && !mutableSourceExists()) {
    return false;
  }
  return gks.get(gk) ?? false;
}

Recoil_gkx.setPass = (gk: string): void => {
  gks.set(gk, true);
};

Recoil_gkx.setFail = (gk: string): void => {
  gks.set(gk, false);
};

module.exports = Recoil_gkx; // @oss-only

// @fb-only: module.exports = require('gkx');
