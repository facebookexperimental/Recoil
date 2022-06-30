/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {
  ItemKey,
  ListenToItems,
  ReadAtom,
  ReadAtomInterface,
  ReadItem,
  RecoilSyncOptions,
  ResetItem,
  StoreKey,
  SyncEffectOptions,
  WriteAtom,
  WriteAtomInterface,
  WriteItems,
} from './RecoilSync';
import type {RecoilURLSyncOptions} from './RecoilSync_URL';
import type {RecoilURLSyncJSONOptions} from './RecoilSync_URLJSON';
import type {
  RecoilURLSyncTransitOptions,
  TransitHandler,
} from './RecoilSync_URLTransit';

const {RecoilSync, syncEffect} = require('./RecoilSync');
const {RecoilURLSync, urlSyncEffect} = require('./RecoilSync_URL');
const {RecoilURLSyncJSON} = require('./RecoilSync_URLJSON');
const {RecoilURLSyncTransit} = require('./RecoilSync_URLTransit');

export type {
  // Keys
  ItemKey,
  StoreKey,
  // Core useRecoilSync() options
  RecoilSyncOptions,
  ReadItem,
  WriteItems,
  ListenToItems,
  // Core syncEffect() options
  SyncEffectOptions,
  ReadAtomInterface,
  ReadAtom,
  WriteAtomInterface,
  WriteAtom,
  ResetItem,
  // URL Synchronization
  RecoilURLSyncOptions,
  RecoilURLSyncJSONOptions,
  RecoilURLSyncTransitOptions,
  TransitHandler,
};

module.exports = {
  // Core Recoil Sync
  RecoilSync,
  syncEffect,

  // Recoil Sync URL
  RecoilURLSync,
  RecoilURLSyncJSON,
  RecoilURLSyncTransit,
  urlSyncEffect,
};
