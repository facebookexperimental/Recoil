// Minimum TypeScript Version: 3.9

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @oncall recoil
 */

/*
 The current Relay TypeScript definitions aren't as careful as the Flow definitions.
 The GraphQLTaggedNode type isn't parameterized, so there is nothing that checks
 that the GraphQL query, subscription, or mutation actually has the expected type
 for the variables or response.
 */

 import * as React from 'react';
 import {
   RecoilState, AtomEffect, GetRecoilValue, SerializableParam,
 } from 'recoil';
 import {
   IEnvironment,
   Variables,
   GraphQLTaggedNode,
   SelectorStoreUpdater,
   UploadableMap,
 } from 'relay-runtime';

 export {};

 // The Relay TypeScript definitions only declare the response as "unknown"
 interface Response { [key: string]: any; }

 export class EnvironmentKey {
   constructor(name: string);
   toJSON(): string;
 }

 export const RecoilRelayEnvironment: React.FC<{
   environmentKey: EnvironmentKey,
   environment: IEnvironment,
   children: React.ReactNode,
 }>;

 export const RecoilRelayEnvironmentProvider: React.FC<{
   environmentKey: EnvironmentKey,
   environment: IEnvironment,
   children: React.ReactNode,
 }>;

 export function graphQLQueryEffect<T>(options: {
   environment: IEnvironment | EnvironmentKey,
   query: GraphQLTaggedNode,
   variables: Variables | null,
   mapResponse: (data: any) => T,
 }): AtomEffect<T>;

 export function graphQLSubscriptionEffect<T>(options: {
   environment: IEnvironment | EnvironmentKey,
   subscription: GraphQLTaggedNode,
   variables: Variables | null,
   mapResponse: (data: any) => T,
 }): AtomEffect<T>;

 export function graphQLMutationEffect<
   T,
   TData extends Response
 >(options: {
   environment: IEnvironment | EnvironmentKey,
   mutation: GraphQLTaggedNode,
   variables: (newData: T) => Variables | null,
   updater_UNSTABLE?: SelectorStoreUpdater<TData>,
   optimisticUpdater_UNSTABLE?: SelectorStoreUpdater<TData>,
   optimisticResponse_UNSTABLE?: (newData: T) => TData,
   uploadables_UNSTABLE?: UploadableMap,
 }): AtomEffect<T>;

 export function graphQLSelector<
   TVariables extends Variables,
   T,
 >(options: {
   key: string,
   environment: IEnvironment | EnvironmentKey,
   query: GraphQLTaggedNode,
   variables:
     | TVariables
     | ((callbacks: {get: GetRecoilValue}) => TVariables | null),
   mapResponse: (
     response: any,
     callbacks: {get: GetRecoilValue, variables: TVariables},
   ) => T,
   default?: T,
   mutations?: {
     mutation: GraphQLTaggedNode,
     variables: (newData: T) => Variables | null,
   },
 }): RecoilState<T>;

 export function graphQLSelectorFamily<
   TVariables extends Variables,
   P extends SerializableParam,
   T,
   TMutationVariables extends Variables = {},
 >(options: {
   key: string,
   environment: IEnvironment | EnvironmentKey,
   query: GraphQLTaggedNode,
   variables:
     | TVariables
     | ((parameter: P) =>
         | TVariables
         | null
         | ((callbacks: {get: GetRecoilValue}) => TVariables | null)
       ),
   mapResponse: (
     response: any,
     callbacks: {get: GetRecoilValue, variables: TVariables},
   ) => T | ((paremter: P) => T),
   default?: T | ((paremter: P) => T),
   mutations?: {
     mutation: GraphQLTaggedNode,
     variables: (newData: T) =>
       | TMutationVariables
       | null
       | ((parameter: P) => TMutationVariables | null),
   },
 }): (parameter: P) => RecoilState<T>;
