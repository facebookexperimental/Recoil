/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

let pass = false;

function Recoil_gkx(_gk: string): boolean {
  return pass;
}

Recoil_gkx.setPass = (_gk: string): void => {
  pass = true;
};

module.exports = Recoil_gkx;
