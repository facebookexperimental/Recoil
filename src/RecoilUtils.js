/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * See https://our.intern.facebook.com/intern/wiki/Recoil/
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

export type {Parameter, SelectorFamilyOptions} from 'Recoil_selectorFamily';

const atomFamily = require('Recoil_atomFamily');
const constSelector = require('Recoil_const');
const errorSelector = require('Recoil_error');
const Link = require('Recoil_Link.react');
const readOnlySelector = require('Recoil_readOnlySelector');
const selectorFamily = require('Recoil_selectorFamily');
const {noWait, waitForAll, waitForAny, waitForNone} = require('Recoil_WaitFor');

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
