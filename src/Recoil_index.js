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
  RecoilValue,
  RecoilState,
  RecoilValueReadOnly,
} from './core/Recoil_RecoilValue';

export type {
  Parameter,
  SelectorFamilyOptions,
} from './recoil_values/Recoil_selectorFamily';

const {RecoilRoot} = require('./components/Recoil_RecoilRoot.react');
const {DefaultValue} = require('./core/Recoil_Node');
const {isRecoilValue} = require('./core/Recoil_RecoilValue');
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
const atom = require('./recoil_values/Recoil_atom');
const atomFamily = require('./recoil_values/Recoil_atomFamily');
const constSelector = require('./recoil_values/Recoil_const');
const errorSelector = require('./recoil_values/Recoil_error');
const readOnlySelector = require('./recoil_values/Recoil_readOnlySelector');
const selector = require('./recoil_values/Recoil_selector');
const selectorFamily = require('./recoil_values/Recoil_selectorFamily');
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

  // Convenience RecoilValues
  atomFamily,
  selectorFamily,
  constSelector,
  errorSelector,
  readOnlySelector,

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

  // Concurrency Helpers
  noWait,
  waitForNone,
  waitForAny,
  waitForAll,

  // Other functions
  isRecoilValue,
};
