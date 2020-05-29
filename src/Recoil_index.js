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
  PersistenceSettings,
  PersistenceType,
} from './recoil_values/Recoil_atom';
export type {SetterOrUpdater} from './hooks/Recoil_Hooks';
export type {Loadable} from './adt/Recoil_Loadable';
export type {
  GetRecoilValue,
  SetRecoilState,
  ResetRecoilState,
} from './recoil_values/Recoil_selector';
export type {
  Parameter,
  SelectorFamilyOptions,
} from './recoil_values/Recoil_selectorFamily';
export type {
  RecoilValue,
  RecoilState,
  RecoilValueReadOnly,
} from './core/Recoil_RecoilValue';

const atom = require('./recoil_values/Recoil_atom');
const atomFamily = require('./recoil_values/Recoil_atomFamily');
const {
  useRecoilCallback,
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilValue,
  useRecoilValueLoadable,
  useResetRecoilState,
  useSetRecoilState,
  useSetUnvalidatedAtomValues,
  useTransactionObservation,
  useTransactionSubscription,
} = require('./hooks/Recoil_Hooks');
const {DefaultValue} = require('./core/Recoil_Node');
const {RecoilRoot} = require('./components/Recoil_RecoilRoot.react');
const {isRecoilValue} = require('./core/Recoil_RecoilValue');
const selector = require('./recoil_values/Recoil_selector');
const selectorFamily = require('./recoil_values/Recoil_selectorFamily');
const readOnlySelector = require('./recoil_values/Recoil_readOnlySelector');
const constSelector = require('./recoil_values/Recoil_const');
const errorSelector = require('./recoil_values/Recoil_error');
const Link = require('./components/Recoil_Link.react');
const {
  noWait,
  waitForAll,
  waitForAny,
  waitForNone,
} = require('./recoil_values/Recoil_WaitFor');

module.exports = {
  // Types
  DefaultValue,

  // Components
  RecoilRoot,

  // RecoilValues
  atom,
  selector,

  // Hooks that accept RecoilValues
  useRecoilValue,
  useRecoilValueLoadable,
  useRecoilState,
  useRecoilStateLoadable,
  useSetRecoilState,
  useResetRecoilState,

  // Hooks for asynchronous Recoil
  useRecoilCallback,

  // Hooks for Persistence/Debugging
  useTransactionObservation_UNSTABLE: useTransactionObservation,
  useTransactionSubscription_UNSTABLE: useTransactionSubscription,
  useSetUnvalidatedAtomValues_UNSTABLE: useSetUnvalidatedAtomValues,

  // Other functions
  isRecoilValue,

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
