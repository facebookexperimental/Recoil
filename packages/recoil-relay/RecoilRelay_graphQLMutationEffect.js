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
import type {AtomEffect, RecoilState} from 'Recoil';
import type {Variables} from 'react-relay';
import type {
  IEnvironment,
  Mutation,
  SelectorStoreUpdater,
  UploadableMap,
} from 'relay-runtime';

const {getRelayEnvironment} = require('./RecoilRelay_Environments');
const {commitMutation} = require('react-relay');
const recoverableViolation = require('recoil-shared/util/Recoil_recoverableViolation');

// TODO Use async atom support to set atom to error state.
// For now, log as a recoverableViolation() so errors aren't lost.
function logError<T>(node: RecoilState<T>, msg: string) {
  recoverableViolation(
    `Error syncing atom "${node.key}" with GraphQL: ${msg}`,
    'recoil',
  );
}

/** graphQLMutationEffect()
 * Commit a GraphQL mutation each time the atom value is mutated.
 * - `environment`: The Relay Environment or an EnvironmentKey to match with
 *   the environment provided with `<RecoilRelayEnvironemnt>`.
 * - `mutation`: The GraphQL mutation.
 * - `variables`: Variables object provided as input to GraphQL mutation.  It is
 *   a callback that receives the updated atom value as the parameter.
 *   If null, then skip mutation.
 * - `updater`: Optional `updater()` function passed to `commitMutation()`.
 * - `optimisticUpdater`: Optional `optimisticUpdater()` function passed to `commitMutation()`.
 * - `optimisticResponse`: Optional optimistic response passed to `commitMutation()`.
 * - `uploadables`: Optional `uploadables` passed to `commitMutation()`.
 */
function graphQLMutationEffect<
  TVariables: Variables,
  T,
  TResponse: $ReadOnly<{[string]: mixed}> = {},
  TRawResponse = void,
>({
  environment: environmentOpt,
  mutation,
  variables,
  updater_UNSTABLE: updater,
  optimisticUpdater_UNSTABLE: optimisticUpdater,
  optimisticResponse_UNSTABLE: optimisticResponse,
  uploadables_UNSTABLE: uploadables,
}: {
  environment: IEnvironment | EnvironmentKey,
  mutation: Mutation<TVariables, TResponse, TRawResponse>,
  variables: T => TVariables | null,
  updater_UNSTABLE?: SelectorStoreUpdater<TResponse>,
  optimisticUpdater_UNSTABLE?: SelectorStoreUpdater<TResponse>,
  optimisticResponse_UNSTABLE?: T => TResponse,
  uploadables_UNSTABLE?: UploadableMap,
}): AtomEffect<T> {
  let currentMutationID = 0;
  return ({node, onSet, setSelf, storeID, parentStoreID_UNSTABLE}) => {
    const environment = getRelayEnvironment(
      environmentOpt,
      storeID,
      parentStoreID_UNSTABLE,
    );

    // Local atom mutations will sync to update remote state
    // Treat as write-through cache, so local atom will update immediatly
    // and then write through to GraphQL mutation.
    onSet((newValue, oldValue) => {
      const mutationID = ++currentMutationID;
      const mutationVariables = variables(newValue);
      if (mutationVariables != null) {
        commitMutation(environment, {
          mutation,
          variables: mutationVariables,
          onError: error => {
            logError(node, error.message ?? 'GraphQL Mutation');
            // TODO, use logError() to set atom to error state instead?
            if (mutationID === currentMutationID) {
              setSelf(potentialyBadValue =>
                // Avoid reverting value if atom was set in the meantime even if
                // the newer commitMutation() hasn't started yet.
                potentialyBadValue === newValue ? oldValue : potentialyBadValue,
              );
            }
          },
          updater,
          optimisticUpdater,
          optimisticResponse: optimisticResponse?.(newValue),
          uploadables,
        });
      }
    });
  };
}

module.exports = graphQLMutationEffect;
