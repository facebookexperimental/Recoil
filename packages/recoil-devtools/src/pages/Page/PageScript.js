/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {
  DevToolsConnnectProps,
  DevToolsOptions,
  RecoilDevToolsActionsType,
  RecoilSnapshot,
} from '../../types/DevtoolsTypes';

const {
  ExtensionSource,
  ExtensionSourceContentScript,
  RecoilDevToolsActions,
} = require('../../constants/Constants');
const EvictableList = require('../../utils/EvictableList');
const {debug} = require('../../utils/Logger');
const {serialize} = require('../../utils/Serialization');

const DefaultCustomSerialize = (item: mixed, _: string): mixed => item;

async function normalizeSnapshot(
  snapshot: ?RecoilSnapshot,
  onlyDirty: boolean,
  props: DevToolsConnnectProps,
): Promise<{modifiedValues?: {[string]: mixed}}> {
  if (snapshot == null) {
    return {modifiedValues: undefined};
  }

  const dirtyNodes = snapshot.getNodes_UNSTABLE({isModified: onlyDirty});
  const customSerialize = props.serializeFn ?? DefaultCustomSerialize;
  const modifiedValues = {};
  const subscribers = new Set();

  // We wrap this loop into a promise to defer the execution
  // of the second (subscribers) loop, so selector
  // can settle before we check their values
  await new Promise(resolve => {
    for (const node of dirtyNodes) {
      const info = snapshot.getInfo_UNSTABLE(node);
      // We only accumulate subscribers if we are looking at only dirty nodes
      if (onlyDirty) {
        subscribers.add(...Array.from(info.subscribers.nodes));
      }
      modifiedValues[node.key] = {
        content: serialize(
          customSerialize(info.loadable?.contents, node.key),
          props.maxDepth,
          props.maxItems,
        ),
        nodeType: info.type,
        deps: Array.from(info.deps).map(n => n.key),
      };
    }
    resolve();
  });

  for (const node of subscribers) {
    if (node != null) {
      const info = snapshot.getInfo_UNSTABLE(node);
      modifiedValues[node.key] = {
        content: serialize(
          customSerialize(info.loadable?.contents, node.key),
          props.maxDepth,
          props.maxItems,
        ),
        nodeType: info.type,
        isSubscriber: true,
        deps: Array.from(info.deps).map(n => n.key),
      };
    }
  }

  return {
    modifiedValues,
  };
}

type MessageEventFromBackground = {
  data?: ?{
    source: string,
    action: RecoilDevToolsActionsType,
    snapshotId?: number,
  },
};

const __RECOIL_DEVTOOLS_EXTENSION__ = {
  connect: (props: DevToolsConnnectProps) => {
    debug('CONNECT_PAGE', props);
    initConnection(props);
    const {devMode, goToSnapshot, initialSnapshot} = props;
    const previousSnapshots = new EvictableList<RecoilSnapshot>(
      props.persistenceLimit,
    );
    if (devMode && initialSnapshot != null) {
      previousSnapshots.add(initialSnapshot);
    }

    let loadedSnapshot = initialSnapshot;
    const backgroundMessageListener = (message: MessageEventFromBackground) => {
      if (message.data?.source === ExtensionSourceContentScript) {
        if (message.data?.action === RecoilDevToolsActions.GO_TO_SNAPSHOT) {
          loadedSnapshot = previousSnapshots.get(message.data?.snapshotId);
          if (loadedSnapshot != null) {
            goToSnapshot(loadedSnapshot);
          }
        }
      }
    };
    window.addEventListener('message', backgroundMessageListener);

    // This function is called when a trasaction is detected
    return {
      disconnect() {
        window.removeEventListener('message', backgroundMessageListener);
      },
      async track(
        txID: number,
        snapshot: RecoilSnapshot,
        _previousSnapshot: RecoilSnapshot,
      ) {
        // if we just went to a snapshot, we don't need to record a new transaction
        if (
          loadedSnapshot != null &&
          loadedSnapshot.getID() === snapshot.getID()
        ) {
          return;
        }
        // reset the just loaded snapshot
        loadedSnapshot = null;
        // On devMode we accumulate the list of rpevious snapshots
        // to be able to time travel
        if (devMode) {
          previousSnapshots.add(snapshot);
        }

        window.postMessage(
          {
            action: RecoilDevToolsActions.UPDATE,
            source: ExtensionSource,
            txID,
            message: await normalizeSnapshot(snapshot, true, props),
          },
          '*',
        );
      },
    };
  },
};

async function initConnection(props: DevToolsConnnectProps) {
  const initialValues = await normalizeSnapshot(
    props.initialSnapshot,
    false,
    props,
  );
  window.postMessage(
    {
      action: RecoilDevToolsActions.INIT,
      source: ExtensionSource,
      props: {
        devMode: props.devMode,
        name: props?.name ?? document.title,
        persistenceLimit: props.persistenceLimit,
        initialValues: initialValues.modifiedValues,
      },
    },
    '*',
  );
}

window.__RECOIL_DEVTOOLS_EXTENSION__ = __RECOIL_DEVTOOLS_EXTENSION__;
if (__DEV__) {
  window.__RECOIL_DEVTOOLS_EXTENSION_DEV__ = __RECOIL_DEVTOOLS_EXTENSION__;
}
debug('EXTENSION_EXPOSED');
