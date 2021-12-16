// Minimum TypeScript Version: 3.7

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 */

 import * as React from 'react';
 import {
   DefaultValue, Loadable, AtomEffect,
 } from 'recoil';
 import {
   Checker,
 } from 'refine';

 ////////////////////////
 // Core RecoilSync
 ////////////////////////

 // Keys
 export type ItemKey = string;
 export type StoreKey = string;

 // useRecoilSync() - read
 export type ReadItem = (itemKey: ItemKey) =>
 | DefaultValue
 | Promise<DefaultValue | unknown>
 | Loadable<DefaultValue | unknown>
 | unknown;

 // useRecoilSync() - write
 export type ItemDiff = Map<ItemKey, DefaultValue | unknown>;
 export type ItemSnapshot = Map<ItemKey, DefaultValue | unknown>;
 export interface WriteInterface {
   diff: ItemDiff;
   allItems: ItemSnapshot;
 }
 export type WriteItems = (state: WriteInterface) => void;

 // useRecoilSync() - listen
 export type UpdateItem = (itemKey: ItemKey, newValue: DefaultValue | unknown) => void;
 export type UpdateAllKnownItems = (items: ItemSnapshot) => void;
 export interface ListenInterface {
   updateItem: UpdateItem;
   updateAllKnownItems: UpdateAllKnownItems;
 }
 export type ListenToItems = (callbacks: ListenInterface) => void | (() => void);

 // useRecoilSync()
 export interface RecoilSyncOptions {
   storeKey?: StoreKey;
   write?: WriteItems;
   read?: ReadItem;
   listen?: ListenToItems;
 }
 export function useRecoilSync(opt: RecoilSyncOptions): void;

 // <RecoilSync/>
 export const RecoilSync: React.FC<RecoilSyncOptions>;

 // syncEffect() - read
 export interface ReadAtomInterface {
   read: ReadItem;
 }
 export type ReadAtom = (callbacks: ReadAtomInterface) =>
 | DefaultValue
 | Promise<DefaultValue | unknown>
 | Loadable<DefaultValue | unknown>
 | unknown;

 // syncEffect() - write
 export type WriteItem = (itemKey: ItemKey, newValue: DefaultValue | unknown) => void;
 export type ResetItem = (itemKey: ItemKey) => void;
 export interface WriteAtomInterface {
   write: WriteItem;
   reset: ResetItem;
   read: ReadItem;
 }
 export type WriteAtom<T> = (callbacks: WriteAtomInterface, newValue: DefaultValue | T) => void;

 // syncEffect()
 export interface SyncEffectOptions<T> {
   storeKey?: StoreKey;
   itemKey?: ItemKey;
   refine: Checker<T>;
   read?: ReadAtom;
   write?: WriteAtom<T>;
   syncDefault?: boolean;
 }
 export function syncEffect<T>(opt: SyncEffectOptions<T>): AtomEffect<T>;

 ////////////////////////
 // RecoilSync_URL
 ////////////////////////

 // useRecoilURLSync()
 export type LocationOption =
   | {part: 'href'}
   | {part: 'hash'}
   | {part: 'search'}
   | {part: 'queryParams', param?: string};

 export interface BrowserInterface {
   replaceURL?: (url: string) => void;
   pushURL?: (url: string) => void;
   getURL?: () => string;
   listenChangeURL?: (handler: () => void) => () => void;
 }

 export interface RecoilURLSyncOptions {
   storeKey?: StoreKey;
   location: LocationOption;
   serialize: (data: unknown) => string;
   deserialize: (str: string) => unknown;
   browserInterface?: BrowserInterface;
 }

 export function useRecoilURLSync(opt: RecoilURLSyncOptions): void;

 // <RecoilURLSync/>
 export const RecoilURLSync: React.FC<RecoilURLSyncOptions>;

 // urlSyncEffect()
 export type HistoryOption = 'push' | 'replace';
 export interface URLSyncEffectOptions<T> extends SyncEffectOptions<T> {
   history?: HistoryOption;
 }
 export function urlSyncEffect<T>(opt: URLSyncEffectOptions<T>): AtomEffect<T>;

 // JSON
 export type RecoilURLSyncJSONOptions = Omit<Omit<RecoilURLSyncOptions, 'serialize'>, 'deserialize'>;
 export function useRecoilURLSyncJSON(opt: RecoilURLSyncJSONOptions): void;
 export const RecoilURLSyncJSON: React.FC<RecoilURLSyncJSONOptions>;

 // Transit
 export interface TransitHandler<T extends new (...args: any) => any, S> {
   tag: string;
   class: T;
   write: (data: InstanceType<T>) => S;
   read: (json: S) => InstanceType<T>;
 }
 export interface RecoilURLSyncTransitOptions extends Omit<Omit<RecoilURLSyncOptions, 'serialize'>, 'deserialize'> {
   handlers?: ReadonlyArray<TransitHandler<any, any>>;
 }
 export function useRecoilURLSyncTransit(opt: RecoilURLSyncTransitOptions): void;
 export const RecoilURLSyncTransit: React.FC<RecoilURLSyncTransitOptions>;
