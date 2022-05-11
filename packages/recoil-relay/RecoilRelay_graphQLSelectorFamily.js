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
  // $FlowIssue[incompatible-type]
  variables = x => () => x,
  // $FlowIssue[incompatible-type]
  mapResponse = x => x,
  mutations,
  ...options
}: {
  key: string,
  environment: IEnvironment | EnvironmentKey,
  query:
    | Query<TVariables, TData, TRawResponse>
    | GraphQLSubscription<TVariables, TData, TRawResponse>,
  variables?:
    | TVariables
    | (P => ?TVariables | (({get: GetRecoilValue}) => ?TVariables)),
  mapResponse?: (TData, {get: GetRecoilValue}) => T | (P => T),
  // The default value to use if variables returns null
  default?: T | (P => T),
  mutations?: {
    mutation: Mutation<TMutationVariables, TMutationData, TMutationRawResponse>,
    variables: T => ?TMutationVariables,
  },
}): P => RecoilState<T> {
  const internalAtoms = atomFamily<
    | {source: 'local', data: T}
    | {source: 'remote', response: TData}
    | DefaultValue,
    ?TVariables,
  >({
    key,
    default: new DefaultValue(),
    effects: param =>
      [
        query.params.operationKind === 'query'
          ? graphQLQueryEffect({
              environment,
              variables: param,
              // $FlowIssue[incompatible-call] Type is opaque, no way to refine
              query,
              mapResponse: response => ({source: 'remote', response}),
            })
          : graphQLSubscriptionEffect({
              environment,
              variables: param,
              // $FlowIssue[incompatible-call] Type is opaque, no way to refine
              subscription: query,
              mapResponse: response => ({source: 'remote', response}),
            }),
        mutations &&
          graphQLMutationEffect({
            environment,
            mutation: mutations.mutation,
            variables: localUpdate =>
              // commit mutation if atom is updated locally
              localUpdate.source === 'local' &&
              // Avoid mutation operation if user issued a reset and
              // did not provide a default value.
              !(localUpdate instanceof DefaultValue)
                ? mutations.variables(localUpdate.data)
                : null,
          }),
      ].filter(Boolean),
  });

  function getAtom(parameter, get) {
    const variablesIntermediate:
      | ?TVariables
      | (({get: GetRecoilValue}) => ?TVariables) =
      typeof variables === 'function' ? variables(parameter) : variables;
    const variablesFinal: ?TVariables =
      typeof variablesIntermediate === 'function'
        ? variablesIntermediate({get})
        : variablesIntermediate;

    return internalAtoms(variablesFinal);
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
        const result = get(getAtom(parameter, get));
        if (result instanceof DefaultValue) {
          return 'default' in options
            ? defaultValue(parameter)
            : new Promise(() => {});
        }
        if (result.source === 'local') {
          return result.data;
        }
        const mapped = mapResponse(result.response, {get});
        return typeof mapped === 'function'
          ? // $FlowIssue[incompatible-use]
            mapped(parameter)
          : mapped;
      },
    set:
      parameter =>
      ({set, get}, newValue) =>
        set(
          getAtom(parameter, get),
          newValue instanceof DefaultValue
            ? 'default' in options
              ? {source: 'local', data: defaultValue(parameter)}
              : newValue
            : {source: 'local', data: newValue},
        ),
  });
}

module.exports = graphQLSelectorFamily;
