/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {EnvironmentKey} from './RecoilRelay_Environments';
import type {GetRecoilValue, Parameter, RecoilState} from 'Recoil';
import type {Variables} from 'react-relay';
import type {
  GraphQLSubscription,
  IEnvironment,
  Mutation,
  Query,
} from 'relay-runtime';

const {DefaultValue, atomFamily, selectorFamily} = require('Recoil');

const graphQLMutationEffect = require('./RecoilRelay_graphQLMutationEffect');
const graphQLQueryEffect = require('./RecoilRelay_graphQLQueryEffect');
const graphQLSubscriptionEffect = require('./RecoilRelay_graphQLSubscriptionEffect');
const nullthrows = require('recoil-shared/util/Recoil_nullthrows');

/**
 * graphQLSelectorFamily() implements a selectorFamily() that syncs with a
 * GraphQL Query or Subscription.  The family parameter or other upstream
 * atoms/selectors can be used to define the query variables or transform the
 * results.
 *
 * The selector is writable to act as a local cache of the server.
 * A GraphQL Mutation may also be provided to use the selector as a
 * write-through cache for updates to commit to the server.
 *
 * - `key` - Unique key string to identify this graphQLSelectorFamily
 * - `environment`: The Relay Environment or an EnvironmentKey to match with
 *   the environment provided with `<RecoilRelayEnvironemnt>`.
 * - `query` - GraphQL Query or Subscription
 * - `variables` - Callback to get the Variables to use for this query based
 *   on the family parameters and/or other upstream atoms or selectors.
 *   Return `null` to avoid the query if appropriate and use the `default` value.
 * - `default` - Optional default value to use if the query is skipped.
 * - `mapResponse` - Optional callback to transform the results based on the
 *   family parameters or upstream atoms or selectors.
 * - `mutations` - Optional GraphQL Mutation and variables to commit when the
 *   selector is written to.
 */
function graphQLSelectorFamily<
  TVariables: Variables,
  TData: $ReadOnly<{[string]: mixed}>,
  P: Parameter = TVariables,
  T = TData,
  TRawResponse = void,
  TMutationVariables: Variables = {},
  TMutationData: $ReadOnly<{[string]: mixed}> = {},
  TMutationRawResponse = void,
>({
  key,
  environment,
  query,
  variables,
  mapResponse,
  mutations,
  ...options
}: {
  key: string,
  environment: IEnvironment | EnvironmentKey,
  query:
    | Query<TVariables, TData, TRawResponse>
    | GraphQLSubscription<TVariables, TData, TRawResponse>,
  variables:
    | TVariables
    | (P => TVariables | null | (({get: GetRecoilValue}) => TVariables | null)),
  mapResponse: (
    TData,
    {get: GetRecoilValue, variables: TVariables},
  ) => T | (P => T),
  // The default value to use if variables returns null
  default?: T | (P => T),
  mutations?: {
    mutation: Mutation<TMutationVariables, TMutationData, TMutationRawResponse>,
    variables: T =>
      | TMutationVariables
      | null
      | (P => TMutationVariables | null),
  },
}): P => RecoilState<T> {
  const internalAtoms = atomFamily<
    | {source: 'local', parameter: P, data: T}
    | {source: 'remote', response: TData}
    | DefaultValue,
    TVariables | null,
  >({
    key,
    default: new DefaultValue(),
    effects: vars =>
      [
        query.params.operationKind === 'query'
          ? graphQLQueryEffect({
              environment,
              variables: vars,
              // $FlowIssue[incompatible-call] Type is opaque, no way to refine
              query,
              mapResponse: response => ({source: 'remote', response}),
            })
          : graphQLSubscriptionEffect({
              environment,
              variables: vars,
              // $FlowIssue[incompatible-call] Type is opaque, no way to refine
              subscription: query,
              mapResponse: response => ({source: 'remote', response}),
            }),
        mutations &&
          graphQLMutationEffect({
            environment,
            mutation: mutations.mutation,
            variables: localUpdate => {
              if (
                // commit mutation only if atom is updated locally
                localUpdate.source === 'local' &&
                // Avoid mutation operation if user issued a reset and
                // did not provide a default value.
                !(localUpdate instanceof DefaultValue)
              ) {
                const variablesIntermediate = mutations.variables(
                  localUpdate.data,
                );
                return typeof variablesIntermediate === 'function'
                  ? variablesIntermediate(localUpdate.parameter)
                  : variablesIntermediate;
              } else {
                return null;
              }
            },
          }),
      ].filter(Boolean),
  });

  function getVariables(parameter: P, get: GetRecoilValue) {
    const variablesIntermediate:
      | null
      | TVariables
      | (({get: GetRecoilValue}) => TVariables | null) =
      typeof variables === 'function' ? variables(parameter) : variables;
    return typeof variablesIntermediate === 'function'
      ? variablesIntermediate({get})
      : variablesIntermediate;
  }

  const defaultValue: P => T = parameter =>
    typeof options.default === 'function'
      ? // $FlowIssue[incompatible-use]
        options.default(parameter)
      : // $FlowIssue[incompatible-type]
        options.default;

  return selectorFamily<T, P>({
    key: `${key}__Wrapper`,
    get:
      parameter =>
      ({get}) => {
        const vars = getVariables(parameter, get);
        const result = get(internalAtoms(vars));
        if (result instanceof DefaultValue) {
          return 'default' in options
            ? defaultValue(parameter)
            : new Promise(() => {});
        }
        if (result.source === 'local') {
          return result.data;
        }
        const mapped = mapResponse(result.response, {
          get,
          variables: nullthrows(vars),
        });
        return typeof mapped === 'function'
          ? // $FlowIssue[incompatible-use]
            mapped(parameter)
          : mapped;
      },
    set:
      parameter =>
      ({set, get}, newValue) =>
        set(
          internalAtoms(getVariables(parameter, get)),
          newValue instanceof DefaultValue
            ? 'default' in options
              ? {source: 'local', parameter, data: defaultValue(parameter)}
              : newValue
            : {source: 'local', parameter, data: newValue},
        ),
  });
}

module.exports = graphQLSelectorFamily;
