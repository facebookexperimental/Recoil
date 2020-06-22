/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * See https://our.intern.facebook.com/intern/wiki/Recoil/
 *
 * @emails oncall+recoil
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

const {DefaultValue} = require('./core/Recoil_Node');
const {RecoilRoot} = require('./core/Recoil_RecoilRoot.react');
const {isRecoilValue} = require('./core/Recoil_RecoilValue');
const {
  useGotoRecoilSnapshot,
  useRecoilCallback,
  useRecoilSnapshot,
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilTransactionObserver,
  useRecoilValue,
  useRecoilValueLoadable,
  useResetRecoilState,
  useSetRecoilState,
  useSetUnvalidatedAtomValues,
  useTransactionObservation_DEPRECATED,
} = require('./hooks/Recoil_Hooks');
const atom = require('./recoil_values/Recoil_atom');
const atomFamily = require('./recoil_values/Recoil_atomFamily');
const constSelector = require('./recoil_values/Recoil_constSelector');
const errorSelector = require('./recoil_values/Recoil_errorSelector');
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

  // Hooks for Snapshots
  useGotoRecoilSnapshot,
  useRecoilSnapshot,
  useRecoilTransactionObserver_UNSTABLE: useRecoilTransactionObserver,
  useTransactionObservation_UNSTABLE: useTransactionObservation_DEPRECATED,
  useSetUnvalidatedAtomValues_UNSTABLE: useSetUnvalidatedAtomValues,

  // Concurrency Helpers
  noWait,
  waitForNone,
  waitForAny,
  waitForAll,

  // Other functions
  isRecoilValue,
};
