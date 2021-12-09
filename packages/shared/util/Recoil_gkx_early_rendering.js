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

const gkx = require('./Recoil_gkx');
const {mutableSourceExists} = require('./Recoil_mutableSource');

/**
 * recoil_early_rendering_2021 only works with useMutableSource()
 * Also couple it with recoil_suppress_rerender_in_callback as it resolves
 * some corner cases with that feature.
 */
function gkx_early_rendering(): boolean {
  // recoil_early_rendering_2021 only works with useMutableSource()
  if (!mutableSourceExists()) {
    return false;
  }

  return (
    gkx('recoil_suppress_rerender_in_callback') ||
    gkx('recoil_early_rendering_2021')
  );
}

module.exports = gkx_early_rendering;
