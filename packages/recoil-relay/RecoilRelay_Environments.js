/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {Snapshot, StoreID} from 'Recoil';
import type {IEnvironment} from 'relay-runtime';

const {useRecoilStoreID} = require('Recoil');

const React = require('react');
const {useEffect} = require('react');
const {RelayEnvironmentProvider} = require('react-relay');
const err = require('recoil-shared/util/Recoil_err');

class EnvironmentKey {
  _name: string;

  constructor(name: string) {
    this._name = name;
  }

  toJSON(): string {
    return this._name;
  }
}

const environmentStore: Map<
  StoreID,
  Map<EnvironmentKey, IEnvironment>,
> = new Map();

const cleanupHandlers: Map<StoreID, Map<EnvironmentKey, TimeoutID>> = new Map();

function registerRelayEnvironment(
  storeID: StoreID,
  environment: IEnvironment,
  environmentKey: EnvironmentKey,
): () => void {
  if (!environmentStore.has(storeID)) {
    environmentStore.set(storeID, new Map());
  }
  const previousEnvironment = environmentStore
    .get(storeID)
    ?.get(environmentKey);
  if (previousEnvironment != null && previousEnvironment !== environment) {
    throw err(
      `A consistent Relay environment should be used with the same Recoil store and EnvironmentKey "${environmentKey.toJSON()}"`,
    );
  }
  environmentStore.get(storeID)?.set(environmentKey, environment);

  // Cleanup registered Relay Environments when they are no longer used to
  // avoid memory leaks.  However, defer it for an event look in case we are
  // running in <StrcitMode> which may call the effects, cleanup the effects,
  // and then call the effects of other components which try to re-query before
  // this effect to re-register gets re-called.  This should be safe because in
  // production the environment registered should never change.
  const pendingCleanup = cleanupHandlers.get(storeID)?.get(environmentKey);
  if (pendingCleanup != null) {
    window.clearTimeout(pendingCleanup);
    cleanupHandlers.get(storeID)?.delete(environmentKey);
  }
  return () => {
    const cleanupHandle = window.setTimeout(() => {
      environmentStore.get(storeID)?.delete(environmentKey);
    }, 0);
    const oldHandler = cleanupHandlers.get(storeID)?.get(environmentKey);
    if (oldHandler != null) {
      window.clearTimeout(oldHandler);
    }
    if (!cleanupHandlers.has(storeID)) {
      cleanupHandlers.set(storeID, new Map());
    }
    cleanupHandlers.get(storeID)?.set(environmentKey, cleanupHandle);
  };
}

/**
 * @explorer-desc
 * Associates a RelayEnvironment with an EnvironmentKey for this <RecoilRoot>.
 */
function RecoilRelayEnvironment({
  environmentKey,
  environment,
  children,
}: {
  environmentKey: EnvironmentKey,
  environment: IEnvironment,
  children: React.Node,
}): React.Node {
  const storeID = useRecoilStoreID();
  registerRelayEnvironment(storeID, environment, environmentKey);
  // Cleanup to avoid leaking retaining Relay Environments.
  useEffect(
    () => registerRelayEnvironment(storeID, environment, environmentKey),
    [storeID, environment, environmentKey],
  );

  return children;
}

/**
 * A provider which sets up the Relay environment for its children and
 * registers that environment for any Recoil atoms or selectors using that
 * environmentKey.
 *
 * This is basically a wrapper around both <RelayEnvironmentProvider> and
 * <RecoilRelayEnvironment>.
 */
function RecoilRelayEnvironmentProvider({
  environmentKey,
  environment,
  children,
}: {
  environmentKey: EnvironmentKey,
  environment: IEnvironment,
  children: React.Node,
}): React.Node {
  return (
    <RecoilRelayEnvironment
      environmentKey={environmentKey}
      environment={environment}>
      <RelayEnvironmentProvider environment={environment}>
        {children}
      </RelayEnvironmentProvider>
    </RecoilRelayEnvironment>
  );
}

function registerRecoilSnapshotRelayEnvironment(
  snapshot: Snapshot,
  environmentKey: EnvironmentKey,
  environment: IEnvironment,
): () => void {
  const storeID = snapshot.getStoreID();
  return registerRelayEnvironment(storeID, environment, environmentKey);
}

function getRelayEnvironment(
  environmentOpt: IEnvironment | EnvironmentKey,
  storeID: StoreID,
  parentStoreID?: StoreID,
): IEnvironment {
  if (environmentOpt instanceof EnvironmentKey) {
    const environment =
      environmentStore.get(storeID)?.get(environmentOpt) ??
      (parentStoreID != null
        ? environmentStore.get(parentStoreID)?.get(environmentOpt)
        : null);
    if (environment == null) {
      throw err(
        `<RecoilRelayEnvironment> must be used at the top of your <RecoilRoot> with the same EnvironmentKey "${environmentOpt.toJSON()}" to register the Relay environment.`,
      );
    }
    return environment;
  }
  return environmentOpt;
}

module.exports = {
  EnvironmentKey,
  RecoilRelayEnvironment,
  RecoilRelayEnvironmentProvider,
  registerRecoilSnapshotRelayEnvironment,
  getRelayEnvironment,
};
