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
import type {AtomEffect, RecoilState} from 'Recoil';
import type {Variables} from 'react-relay';
import type {GraphQLSubscription, IEnvironment, Query} from 'relay-runtime';

const {getRelayEnvironment} = require('./RecoilRelay_Environments');
const {fetchQuery} = require('react-relay');
const recoverableViolation = require('recoil-shared/util/Recoil_recoverableViolation');
const {
  createOperationDescriptor,
  getRequest,
  handlePotentialSnapshotErrors,
} = require('relay-runtime');

// TODO Use async atom support to set atom to error state.
// For now, log as a recoverableViolation() so errors aren't lost.
function logError<T>(node: RecoilState<T>, msg: string) {
  recoverableViolation(
    `Error syncing atom "${node.key}" with GraphQL: ${msg}`,
    'recoil',
  );
}

function subscibeToLocalRelayCache<
  TVariables: Variables,
  TData: $ReadOnly<{[string]: mixed}>,
  TRawResponse = void,
>(
  environment: IEnvironment,
  query:
    | Query<TVariables, TData, TRawResponse>
    | GraphQLSubscription<TVariables, TData, TRawResponse>,
  variables: TVariables,
  onNext: TData => void,
): () => void {
  const request = getRequest(query);
  const operation = createOperationDescriptor(request, variables);
  const operationDisposable = environment.retain(operation);
  const snapshot = environment.lookup(operation.fragment);
  const subscriptionDisposable = environment.subscribe(
    snapshot,
    newSnapshot => {
      handlePotentialSnapshotErrors(
        environment,
        newSnapshot.missingRequiredFields,
        newSnapshot.relayResolverErrors,
      );
      if (!newSnapshot.isMissingData && newSnapshot.data != null) {
        // $FlowExpectedError[incompatible-call]
        onNext(newSnapshot.data);
      }
    },
  );

  return () => {
    operationDisposable?.dispose();
    subscriptionDisposable?.dispose();
  };
}

/** graphQLQueryEffect()
 * Initialize an atom based on the results of a GraphQL query.
 * - `environment`: The Relay Environment or an EnvironmentKey to match with
 *   the environment provided with `<RecoilRelayEnvironemnt>`.
 * - `query`: The GraphQL query to query.
 * - `variables`: Variables object provided as input to GraphQL query.
 *   If null, then skip query and use default value.
 * - `mapResponse`: Callback to map the query response to the atom value.
 * - `subscribeToLocalMutations_UNSTABLE` - By default this effect will subscribe to
 *   mutations from local `commitMutation()` or `graphQLMutationEffect()` for the
 *   same part of the graph.  If you also need to subscribe to remote mutations,
 *   then use `graphQLSubscriptionEffect()`.
 */
function graphQLQueryEffect<
  TVariables: Variables,
  TData: $ReadOnly<{[string]: mixed}>,
  T = TData,
  TRawResponse = void,
>({
  environment: environmentOpt,
  query,
  variables,
  mapResponse,
  subscribeToLocalMutations_UNSTABLE = true,
}: {
  environment: IEnvironment | EnvironmentKey,
  query: Query<TVariables, TData, TRawResponse>,
  variables: TVariables | null,
  mapResponse: TData => T,
  subscribeToLocalMutations_UNSTABLE?: boolean,
}): AtomEffect<T> {
  return ({node, setSelf, trigger, storeID, parentStoreID_UNSTABLE}) => {
    if (variables == null) {
      return;
    }

    let querySubscription, localSubscriptionCleanup;
    const environment = getRelayEnvironment(
      environmentOpt,
      storeID,
      parentStoreID_UNSTABLE,
    );

    // Initialize value
    if (trigger === 'get') {
      let initialResolve, initialReject;
      setSelf(
        new Promise((resolve, reject) => {
          initialResolve = resolve;
          initialReject = reject;
        }),
      );

      querySubscription = fetchQuery(environment, query, variables, {
        fetchPolicy: 'store-or-network',
      }).subscribe({
        next: response => {
          const data = mapResponse(response);
          initialResolve(data);
          setSelf(data);
        },
        // TODO use Async atom support to set atom to error state on
        // subsequent errors during incremental updates.
        error: error => {
          initialReject(error);
          logError(node, error.message ?? 'Error');
        },
      });
    }

    // Subscribe to local changes to update atom state.
    // To get remote mutations please use graphQLSubscriptionEffect()
    if (subscribeToLocalMutations_UNSTABLE) {
      localSubscriptionCleanup = subscibeToLocalRelayCache(
        environment,
        query,
        variables,
        data => setSelf(mapResponse(data)),
      );
    }

    return () => {
      querySubscription?.unsubscribe();
      localSubscriptionCleanup?.();
    };
  };
}

module.exports = graphQLQueryEffect;
