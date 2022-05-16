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

import type {GetRecoilValue, RecoilState} from 'Recoil';
import type {EnvironmentKey} from 'RecoilRelay_Environments';
import type {Variables} from 'react-relay';
import type {
  GraphQLSubscription,
  IEnvironment,
  Mutation,
  Query,
} from 'relay-runtime';

const graphQLSelectorFamily = require('./RecoilRelay_graphQLSelectorFamily');

/**
 * graphQLSelector() implements a Recoil selector that syncs with a
 * GraphQL Query or Subscription.  Other upstream  atoms/selectors can be used
 * to help define the query variables or transform the results.
 *
 * The selector is writable to act as a local cache of the server.
 * A GraphQL Mutation may also be provided to use the selector as a
 * write-through cache for updates to commit to the server.
 *
 * - `key` - Unique key string to identify this graphQLSelectorFamily
 * - `environment`: The Relay Environment or an EnvironmentKey to match with
 *   the environment provided with `<RecoilRelayEnvironemnt>`.
 * - `query` - GraphQL Query or Subscription
 * - `variables` - Callback to get the Variables to use for this query that may
 *   be based on other upstream atoms or selectors.
 *   Return `null` to avoid the query if appropriate and use the `default` value.
 * - `default` - Optional default value to use if the query is skipped.
 * - `mapResponse` - Optional callback to transform the results based on
 *   other upstream atoms or selectors.
 * - `mutations` - Optional GraphQL Mutation and variables to commit when the
 *   selector is written to.
 */
function graphQLSelector<
  TVariables: Variables,
  TData: $ReadOnly<{[string]: mixed}>,
  T = TData,
  TRawResponse = void,
  TMutationVariables: Variables = {},
  TMutationData: $ReadOnly<{[string]: mixed}> = {},
  TMutationRawResponse = void,
>({
  variables,
  mutations,
  ...options
}: {
  environment: IEnvironment | EnvironmentKey,
  key: string,
  query:
    | Query<TVariables, TData, TRawResponse>
    | GraphQLSubscription<TVariables, TData, TRawResponse>,
  variables: TVariables | (({get: GetRecoilValue}) => TVariables | null),
  mapResponse: (TData, {get: GetRecoilValue, variables: TVariables}) => T,
  // The default value to use if variables returns null
  default?: T,
  mutations?: {
    mutation: Mutation<TMutationVariables, TMutationData, TMutationRawResponse>,
    variables: T => TMutationVariables | null,
  },
}): RecoilState<T> {
  return graphQLSelectorFamily({
    ...options,
    variables: () => cbs =>
      typeof variables === 'function' ? variables(cbs) : variables,
    mutations: mutations == null ? undefined : {...mutations},
  })();
}

module.exports = graphQLSelector;
