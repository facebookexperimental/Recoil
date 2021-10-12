/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

export type {PersistenceType} from './core/Recoil_Node';
export type {
  RecoilValue,
  RecoilState,
  RecoilValueReadOnly,
} from './core/Recoil_RecoilValue';
export type {
  MutableSnapshot,
  Snapshot,
  SnapshotID,
} from './core/Recoil_Snapshot';
export type {
  RecoilCallbackInterface,
  SetterOrUpdater,
} from './hooks/Recoil_Hooks';
export type {RecoilBridge} from './hooks/Recoil_useRecoilBridgeAcrossReactRoots';
export type {Loadable} from './adt/Recoil_Loadable';
export type {
  AtomEffect,
  PersistenceSettings,
} from './recoil_values/Recoil_atom';
export type {TransactionInterface} from './core/Recoil_AtomicUpdates';
export type {
  GetRecoilValue,
  SetRecoilState,
  ResetRecoilState,
} from './recoil_values/Recoil_callbackTypes';
export type {
  Parameter,
  SelectorFamilyOptions,
} from './recoil_values/Recoil_selectorFamily';
export type {
  AssertionFunction,
  Checker,
  CheckFailure,
  CheckResult,
  CheckSuccess,
  CoercionFunction,
  JSONParser,
  Get,
  Path,
} from './contrib/refine/Refine.js';

const {
  array,
  assertion,
  asType,
  boolean,
  coercion,
  constraint,
  custom,
  date,
  dict,
  lazy,
  literal,
  map,
  match,
  mixed,
  nullable,
  number,
  or,
  record,
  set,
  string,
  stringifyPath,
  stringLiterals,
  template,
  tuple,
  union,
  voidable,
  withDefault,
  writableArray,
  writableDict,
  writableRecord,
} = require('./contrib/refine/Refine');
const {
  jsonParser,
  jsonParserEnforced,
} = require('./contrib/refine/Refine_json');
const {DefaultValue} = require('./core/Recoil_Node');
const {RecoilRoot} = require('./core/Recoil_RecoilRoot.react');
const {isRecoilValue} = require('./core/Recoil_RecoilValue');
const {retentionZone} = require('./core/Recoil_RetentionZone');
const {freshSnapshot} = require('./core/Recoil_Snapshot');
const {
  useGotoRecoilSnapshot,
  useRecoilCallback,
  useRecoilSnapshot,
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilTransaction,
  useRecoilTransactionObserver,
  useRecoilValue,
  useRecoilValueLoadable,
  useResetRecoilState,
  useRetain,
  useSetRecoilState,
  useSetUnvalidatedAtomValues,
  useTransactionObservation_DEPRECATED,
} = require('./hooks/Recoil_Hooks');
const useGetRecoilValueInfo = require('./hooks/Recoil_useGetRecoilValueInfo');
const useRecoilBridgeAcrossReactRoots = require('./hooks/Recoil_useRecoilBridgeAcrossReactRoots');
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
  waitForAllSettled,
  waitForAny,
  waitForNone,
} = require('./recoil_values/Recoil_WaitFor');

module.exports = {
  /////////////////////////////////////////////////////////////////
  // Recoil
  /////////////////////////////////////////////////////////////////

  // Types
  DefaultValue,
  isRecoilValue,

  // Components
  RecoilRoot,
  useRecoilBridgeAcrossReactRoots_UNSTABLE: useRecoilBridgeAcrossReactRoots,

  // RecoilValues
  atom,
  selector,

  // Factories
  retentionZone,
  snapshot_UNSTABLE: freshSnapshot,

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
  useGetRecoilValueInfo_UNSTABLE: useGetRecoilValueInfo,
  useRetain,

  // Hooks for complex operations with RecoilValues
  useRecoilCallback,
  useRecoilTransaction_UNSTABLE: useRecoilTransaction,

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
  waitForAllSettled,

  /////////////////////////////////////////////////////////////////
  // Refine
  /////////////////////////////////////////////////////////////////

  // API
  assertion,
  coercion,
  jsonParser,
  jsonParserEnforced,

  // Checkers - Primitives
  mixed,
  literal,
  boolean,
  number,
  string,
  template,
  stringLiterals,
  date,

  // Checkers - Utility
  or,
  union,
  match,
  nullable,
  voidable,
  withDefault,
  constraint,
  asType,
  lazy,
  custom,

  // Checkers - Containers
  array,
  tuple,
  record,
  dict,
  set,
  map,
  writableArray,
  writableDict,
  writableRecord,

  // Helpers
  stringifyPath,
};
