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

import type {SerializedValue} from '../utils/Serialization';
import type Store from '../utils/Store';
import type {Snapshot} from 'recoil';

const RecoilDevToolsActions = require('../constants/Constants');

export type RecoilSnapshot = Snapshot;

export type SnapshotType = {
  [string]: SerializedValue,
};

export type TransactionNodeType = {
  name: string,
  isSubscriber: boolean,
};

export type TransactionType = {
  ts: Date,
  id: number,
  modifiedValues: $ReadOnlyArray<TransactionNodeType>,
};

export type DependenciesSetType = Set<string>;
export type DependenciesSnapshotType = {[string]: DependenciesSetType};
export type NodesSnapshotType = {[string]: NodeState};

export type BackgroundPage = {
  store: Store,
};

export type DevToolsOptions = $ReadOnly<{
  name?: string,
  persistenceLimit?: number,
  maxDepth?: number,
  maxItems?: number,
  serializeFn?: (mixed, string) => mixed,
  initialSnapshot?: ?RecoilSnapshot,
  devMode: boolean,
}>;

export type DevToolsConnnectProps = $ReadOnly<{
  ...DevToolsOptions,
  goToSnapshot: mixed => void,
}>;

export type RecoilDevToolsActionsType = $Values<typeof RecoilDevToolsActions>;

export type PostMessageData = $ReadOnly<{
  source?: string,
  action?: RecoilDevToolsActionsType,
  props?: DevToolsOptions,
  txID?: number,
}>;

export type ValuesMessageType = {
  [string]: {
    content: SerializedValue,
    nodeType: NodeTypeValues,
    isSubscriber?: boolean,
    deps: string[],
  },
};

export type BackgroundPostMessage = $ReadOnly<{
  action?: RecoilDevToolsActionsType,
  message?: BackgroundPostMessageContent,
  txID: number,
  chunk?: string,
  isFinalChunk?: boolean,
  data?: ?{
    initialValues: ValuesMessageType,
    persistenceLimit?: number,
    devMode?: boolean,
  },
}>;

export type BackgroundPostMessageContent = $ReadOnly<{
  modifiedValues?: ValuesMessageType,
}>;

export type ConnectionPort = {
  sender: Sender,
  name: ?string,
  postMessage: ({
    action: RecoilDevToolsActionsType,
    connectionId: number,
    ...
  }) => void,
};

export type Sender = {
  tab: {
    id: number,
  },
  id: number,
};

export type NodeTypeValues = 'selector' | 'atom' | void;

// Stable data related to a node
export type Node = {
  type: NodeTypeValues,
};

// Data related to a node that may change per transaction
export type NodeState = {
  updateCount: number,
};
