// Minimum TypeScript Version: 3.9

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 */

 import React = require('react');
 import { atom } from 'recoil';
 import {
     EnvironmentKey,
     RecoilRelayEnvironment,
     RecoilRelayEnvironmentProvider,
     graphQLQueryEffect,
     graphQLSubscriptionEffect,
     graphQLMutationEffect,
     graphQLSelector,
     graphQLSelectorFamily,
 } from 'recoil-relay';
 import { IEnvironment, graphql } from 'relay-runtime';
 import { useRelayEnvironment } from 'react-relay';

 // Environment
 const myEnv: IEnvironment = useRelayEnvironment();

 // EnvironmentKey
 const myEnvKey: EnvironmentKey = new EnvironmentKey('test');

 // <RecoilRelayEnvironment>
 RecoilRelayEnvironment({ // $ExpectType ReactElement<any, any> | null
     children: React.createElement('div'),
     environment: myEnv,
     environmentKey: myEnvKey,
 });
 RecoilRelayEnvironment({ // $ExpectType ReactElement<any, any> | null
     children: React.createElement('div'),
     environment: myEnv,
     environmentKey: myEnvKey,
     extraArg: 'ERROR', // $ExpectError
 });
 RecoilRelayEnvironment({ // $ExpectError
     children: React.createElement('div'),
     environment: myEnv,
 });

 // <RecoilRelayEnvironmentProvider>
 RecoilRelayEnvironmentProvider({ // $ExpectType ReactElement<any, any> | null
     children: React.createElement('div'),
     environment: myEnv,
     environmentKey: myEnvKey,
 });
 RecoilRelayEnvironmentProvider({ // $ExpectType ReactElement<any, any> | null
     children: React.createElement('div'),
     environment: myEnv,
     environmentKey: myEnvKey,
     extraArg: 'ERROR', // $ExpectError
 });
 RecoilRelayEnvironmentProvider({ // $ExpectError
     children: React.createElement('div'),
     environment: myEnv,
 });

 // graphQLQueryEffect()
 atom<string>({
     key: 'key',
     effects: [graphQLQueryEffect({
         environment: myEnv,
         query: graphql`query...`,
         variables: {foo: 'bar'},
         mapResponse: (data: {str: string}) => data.str,
     })],
 });
 atom<string>({
     key: 'key',
     effects: [graphQLQueryEffect({
         environment: myEnvKey,
         query: graphql`query...`,
         variables: null,
         mapResponse: (data: {str: string}) => data.str,
     })],
 });
 atom<string>({
     key: 'key',
     effects: [graphQLQueryEffect({ // $ExpectError
         environment: myEnv,
         query: graphql`query...`,
         variables: {foo: 'bar'},
         mapResponse: (data: {str: string}) => data,
     })],
 });

 // graphQLSubscriptionEffect()
 atom<string>({
     key: 'key',
     effects: [graphQLSubscriptionEffect({
         environment: myEnv,
         subscription: graphql`subscription...`,
         variables: {foo: 'bar'},
         mapResponse: (data: {str: string}) => data.str,
     })],
 });
 atom<string>({
     key: 'key',
     effects: [graphQLSubscriptionEffect({
         environment: myEnvKey,
         subscription: graphql`subscription...`,
         variables: null,
         mapResponse: (data: {str: string}) => data.str,
     })],
 });
 atom<string>({
     key: 'key',
     effects: [graphQLSubscriptionEffect({ // $ExpectError
         environment: myEnv,
         subscription: graphql`subscription...`,
         variables: {foo: 'bar'},
         mapResponse: (data: {str: string}) => data,
     })],
 });

 // graphQLMutationEffect()
 atom<string>({
     key: 'key',
     effects: [graphQLMutationEffect({
         environment: myEnv,
         mutation: graphql`mutation...`,
         variables: str => ({foo: str}),
     })],
 });
 atom<string>({
     key: 'key',
     effects: [graphQLMutationEffect({
         environment: myEnvKey,
         mutation: graphql`mutation...`,
         variables: () => null,
     })],
 });
 atom<string>({
     key: 'key',
     effects: [graphQLMutationEffect<string, {bar: string}>({
         environment: myEnv,
         mutation: graphql`mutation...`,
         variables: str => ({foo: str}),
         updater_UNSTABLE: (store, data) => {
             store; // $ExpectType RecordSourceSelectorProxy<{ bar: string; }>
             data; // $ExpectType { bar: string; }
         },
         optimisticUpdater_UNSTABLE: (store, data) => {
             store; // $ExpectType RecordSourceSelectorProxy<{ bar: string; }>
             data; // $ExpectType { bar: string; }
         },
         optimisticResponse_UNSTABLE: str => ({bar: str}),
     })],
 });

 // graphQLSelector()
 graphQLSelector<{foo: string}, string>({ // $ExpectType RecoilState<string>
     key: 'key',
     environment: myEnv,
     query: graphql`query...`,
     variables: {foo: '123'},
     mapResponse: data => data.str,
 });
 graphQLSelector<{foo: string}, string>({ // $ExpectType RecoilState<string>
     key: 'key',
     environment: myEnvKey,
     query: graphql`query...`,
     variables: ({get}) => {
         get; // $ExpectType GetRecoilValue
         return null;
     },
     mapResponse: data => data.str,
 });
 graphQLSelector<{foo: string}, string>({ // $ExpectType RecoilState<string>
     key: 'key',
     environment: myEnv,
     query: graphql`query...`,
     variables: {foo: '123'},
     mapResponse: data => data.str,
     mutations: {
         mutation: graphql`mutation...`,
         variables: (str: string) => ({eggs: str}),
     },
 });
 graphQLSelector<{foo: string}, string>({ // $ExpectType RecoilState<string>
     key: 'key',
     environment: myEnv,
     query: graphql`query...`,
     variables: {foo: '123'},
     mapResponse: data => data.str,
     extraArg: 'ERROR', // $ExpectError
 });
 graphQLSelector<{foo: string}, string>({ // $ExpectError
     key: 'key',
     query: graphql`query...`,
     variables: {foo: '123'},
     mapResponse: data => data.str,
 });
 graphQLSelector<{foo: string}, string>({ // $ExpectType RecoilState<string>
     key: 'key',
     environment: myEnv,
     query: graphql`query...`,
     variables: 'ERROR', // $ExpectError
     mapResponse: data => data.str,
 });

 // graphQLSelectorFamily()
 graphQLSelectorFamily<{foo: string}, string, string>({ // $ExpectType (parameter: string) => RecoilState<string>
     key: 'key',
     environment: myEnv,
     query: graphql`query...`,
     variables: {foo: '123'},
     mapResponse: data => data.str,
 });
 graphQLSelectorFamily<{foo: string}, string, string>({ // $ExpectType (parameter: string) => RecoilState<string>
     key: 'key',
     environment: myEnvKey,
     query: graphql`query...`,
     variables: (str: string) => ({get}) => {
         get; // $ExpectType GetRecoilValue
         return null;
     },
     mapResponse: data => data.str,
 });
 graphQLSelectorFamily<{foo: string}, string, string>({ // $ExpectType (parameter: string) => RecoilState<string>
     key: 'key',
     environment: myEnv,
     query: graphql`query...`,
     variables: {foo: '123'},
     mapResponse: data => data.str,
     mutations: {
         mutation: graphql`mutation...`,
         variables: (str: string) => (param: string) => ({eggs: str}),
     },
 });
 graphQLSelectorFamily<{foo: string}, string, string>({ // $ExpectType (parameter: string) => RecoilState<string>
     key: 'key',
     environment: myEnv,
     query: graphql`query...`,
     variables: {foo: '123'},
     mapResponse: data => data.str,
     extraArg: 'ERROR', // $ExpectError
 });
 graphQLSelectorFamily<{foo: string}, string, string>({ // $ExpectError
     key: 'key',
     query: graphql`query...`,
     variables: {foo: '123'},
     mapResponse: data => data.str,
 });
 graphQLSelectorFamily<{foo: string}, string, string>({ // $ExpectType (parameter: string) => RecoilState<string>
     key: 'key',
     environment: myEnv,
     query: graphql`query...`,
     variables: 'ERROR', // $ExpectError
     mapResponse: data => data.str,
 });
