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
  BackgroundPostMessage,
  ConnectionPort,
  DependenciesSetType,
  Node,
  NodeState,
  TransactionType,
  ValuesMessageType,
} from '../types/DevtoolsTypes';
import type {SerializedValue} from './Serialization';

const {RecoilDevToolsActions} = require('../constants/Constants');
const {depsHaveChaged} = require('../utils/GraphUtils');
const EvictableList = require('./EvictableList');
const TXHashTable = require('./TXHashtable');
const nullthrows = require('nullthrows');

class Connection {
  id: number;
  displayName: string;
  tree: TXHashTable<SerializedValue>;
  dependencies: TXHashTable<DependenciesSetType>;
  transactions: EvictableList<TransactionType>;
  nodes: Map<string, Node>;
  nodesState: TXHashTable<NodeState>;
  devMode: boolean;
  port: ConnectionPort;

  constructor(
    id: number,
    persistenceLimit?: number = 50,
    initialValues?: ?ValuesMessageType,
    displayName?: ?string,
    devMode?: ?boolean,
    port: ConnectionPort,
  ) {
    this.id = nullthrows(id);
    this.displayName = displayName ?? 'Recoil Connection';
    this.tree = new TXHashTable<SerializedValue>(persistenceLimit);
    this.nodesState = new TXHashTable<NodeState>(persistenceLimit);
    this.dependencies = new TXHashTable<DependenciesSetType>(persistenceLimit);
    this.transactions = new EvictableList<TransactionType>(persistenceLimit);
    this.nodes = new Map();
    this.devMode = devMode ?? false;
    this.port = port;

    if (initialValues != null && Object.keys(initialValues).length > 0) {
      this.initializeValues(initialValues);
    }
  }

  initializeValues(values: ValuesMessageType) {
    this.transactions.add({
      modifiedValues: [{name: 'INIT', isSubscriber: false}],
      id: 0,
      ts: new Date(),
    });
    this.persistValues(values, 0);
  }

  processMessage(msg: BackgroundPostMessage, isInit: boolean = false): number {
    const txID = this.transactions.getNextIndex();
    if (msg.message?.modifiedValues != null) {
      this.transactions.add({
        modifiedValues: Object.keys(msg.message.modifiedValues).map(key => ({
          name: key,
          isSubscriber:
            msg.message?.modifiedValues?.[key].isSubscriber === true,
        })),
        id: txID,
        ts: new Date(),
      });

      this.persistValues(msg.message?.modifiedValues, txID);
    }

    return txID;
  }

  persistValues(values: ?ValuesMessageType, txID: number) {
    if (values == null) {
      return;
    }
    Object.keys(values).forEach((key: string) => {
      const item = values[key];
      this.nodes.set(key, {
        type: item?.nodeType,
      });
      this.tree.set(key, item?.content, txID);
      this.nodesState.set(
        key,
        {
          updateCount: (this.nodesState.get(key)?.updateCount ?? 0) + 1,
        },
        txID,
      );

      const newDeps = new Set(item?.deps ?? []);
      if (depsHaveChaged(this.dependencies.get(key), newDeps)) {
        this.dependencies.set(key, newDeps, txID);
      }
    });
  }

  getNode(name: string | number): ?Node {
    return this.nodes.get(String(name));
  }

  goToSnapshot(id: number): void {
    this.port?.postMessage({
      action: RecoilDevToolsActions.GO_TO_SNAPSHOT,
      connectionId: this.id,
      snapshotId: id,
    });
  }
}

module.exports = Connection;
