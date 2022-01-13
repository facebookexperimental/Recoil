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

export type {StoreID} from './core/Recoil_Keys';
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
export type {SetterOrUpdater} from './hooks/Recoil_Hooks';
export type {RecoilCallbackInterface} from './hooks/Recoil_useRecoilCallback';
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

import {RecoilLoadable} from './adt/Recoil_Loadable';
import {DefaultValue} from './core/Recoil_Node';
import {RecoilRoot, useRecoilStoreID} from './core/Recoil_RecoilRoot';
import {isRecoilValue} from './core/Recoil_RecoilValue';
import {retentionZone} from './core/Recoil_RetentionZone';
import {freshSnapshot as snapshot_UNSTABLE} from './core/Recoil_Snapshot';
import {
  useRecoilState,
  useRecoilStateLoadable,
  useRecoilValue,
  useRecoilValueLoadable,
  useResetRecoilState,
  useSetRecoilState,
} from './hooks/Recoil_Hooks';
import {
  useGotoRecoilSnapshot,
  useRecoilSnapshot,
  useRecoilTransactionObserver as useRecoilTransactionObserver_UNSTABLE,
} from './hooks/Recoil_SnapshotHooks';
import useGetRecoilValueInfo_UNSTABLE from './hooks/Recoil_useGetRecoilValueInfo';
import useRecoilBridgeAcrossReactRoots_UNSTABLE from './hooks/Recoil_useRecoilBridgeAcrossReactRoots';
import {useRecoilCallback} from './hooks/Recoil_useRecoilCallback';
import useRecoilRefresher_UNSTABLE from './hooks/Recoil_useRecoilRefresher';
import useRecoilTransaction_UNSTABLE from './hooks/Recoil_useRecoilTransaction';
import useRetain from './hooks/Recoil_useRetain';
import atom from './recoil_values/Recoil_atom';
import atomFamily from './recoil_values/Recoil_atomFamily';
import constSelector from './recoil_values/Recoil_constSelector';
import errorSelector from './recoil_values/Recoil_errorSelector';
import readOnlySelector from './recoil_values/Recoil_readOnlySelector';
import selector from './recoil_values/Recoil_selector';
import selectorFamily from './recoil_values/Recoil_selectorFamily';
import {
  noWait,
  waitForAll,
  waitForAllSettled,
  waitForAny,
  waitForNone,
} from './recoil_values/Recoil_WaitFor';

export {
  // Types
  DefaultValue,
  isRecoilValue,
  RecoilLoadable,
  // Recoil Root
  RecoilRoot,
  useRecoilStoreID,
  useRecoilBridgeAcrossReactRoots_UNSTABLE,
  // Atoms/Selectors
  atom,
  selector,
  // Convenience Atoms/Selectors
  atomFamily,
  selectorFamily,
  constSelector,
  errorSelector,
  readOnlySelector,
  // Concurrency Helpers for Atoms/Selectors
  noWait,
  waitForNone,
  waitForAny,
  waitForAll,
  waitForAllSettled,
  // Hooks for Atoms/Selectors
  useRecoilValue,
  useRecoilValueLoadable,
  useRecoilState,
  useRecoilStateLoadable,
  useSetRecoilState,
  useResetRecoilState,
  useGetRecoilValueInfo_UNSTABLE,
  useRecoilRefresher_UNSTABLE,
  // Hooks for complex operations
  useRecoilCallback,
  useRecoilTransaction_UNSTABLE,
  // Snapshots
  useGotoRecoilSnapshot,
  useRecoilSnapshot,
  useRecoilTransactionObserver_UNSTABLE,
  snapshot_UNSTABLE,
  // Memory Management
  useRetain,
  retentionZone,
};
