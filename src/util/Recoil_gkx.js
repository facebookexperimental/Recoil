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

let pass = false;

function Recoil_gkx(_gk: string): boolean {
  return pass;
}

Recoil_gkx.setPass = (_gk: string): void => {
  pass = true;
};

module.exports = Recoil_gkx;
