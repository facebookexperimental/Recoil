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

export type {PersistenceSettings, PersistenceType} from 'Recoil_atom';
export type {SetterOrUpdater} from 'Recoil_Hooks';
export type {Loadable} from 'Recoil_Loadable';
export type {
  GetRecoilValue,
  SetRecoilState,
  ResetRecoilState,
} from 'Recoil_selector';
export type {
  RecoilValue,
  RecoilState,
  RecoilValueReadOnly,
} from 'Recoil_RecoilValue';

const atom = require('Recoil_atom');
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
} = require('Recoil_Hooks');
const {DefaultValue} = require('Recoil_Node');
const {RecoilRoot} = require('Recoil_RecoilRoot.react');
const {isRecoilValue} = require('Recoil_RecoilValue');
const selector = require('Recoil_selector');

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
};
