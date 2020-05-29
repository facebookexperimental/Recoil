/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * See https://our.intern.facebook.com/intern/wiki/Recoil/
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

export type {
  Parameter,
  SelectorFamilyOptions,
} from './recoil_values/Recoil_selectorFamily';

const atomFamily = require('./recoil_values/Recoil_atomFamily');
const constSelector = require('./recoil_values/Recoil_const');
const errorSelector = require('./recoil_values/Recoil_error');
const Link = require('./components/Recoil_Link.react');
const readOnlySelector = require('./recoil_values/Recoil_readOnlySelector');
const selectorFamily = require('./recoil_values/Recoil_selectorFamily');
const {
  noWait,
  waitForAll,
  waitForAny,
  waitForNone,
} = require('./recoil_values/Recoil_WaitFor');

module.exports = {
  // Convenience RecoilValues
  atomFamily,
  selectorFamily,
  constSelector,
  errorSelector,
  readOnlySelector,

  // Concurrency Helpers
  noWait,
  waitForNone,
  waitForAny,
  waitForAll,

  // Components
  Link_UNSTABLE: Link,
};
