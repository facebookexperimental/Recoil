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
import type {SerializedValue} from './Serialization';
type TXItem = {
  transactionId: number,
  timestamp: number,
  value: SerializedValue,
};

const nullthrows = require('nullthrows');
const EvictableList = require('./EvictableList');

class TXHashTable<TBaseItem> {
  map: Map<
    string,
    EvictableList<{
      transactionId: number,
      timestamp: number,
      value: TBaseItem,
    }>,
  >;
  persistenceLimit: number;

  // TODO: add persistenceLimit and evictions
  constructor(persistenceLimit?: number = 50) {
    this.map = new Map();
    this.persistenceLimit = persistenceLimit;
  }

  reset(): void {
    this.map = new Map();
  }

  set(atomName: string, value: ?TBaseItem, transactionId: number): void {
    if (value == null) {
      return;
    }
    if (!this.map.has(atomName)) {
      this.map.set(
        atomName,
        new EvictableList<{
          transactionId: number,
          timestamp: number,
          value: TBaseItem,
        }>(this.persistenceLimit),
      );
    }
    nullthrows(this.map.get(atomName)).add({
      transactionId,
      timestamp: Date.now(),
      value,
    });
  }

  get(atomName: string, transactionId?: ?number): ?TBaseItem {
    const data = this.map.get(atomName);
    if (data == null || data.getSize() === 0) {
      return undefined; // or null?
    }
    const foundItem =
      transactionId == null
        ? data.getLastValue()
        : data.findLast(
            item => item != null && item.transactionId <= transactionId,
          );

    if (foundItem == null) {
      return undefined;
    }

    return foundItem.value;
  }

  // TODO: memoize
  getSnapshot(transactionId?: number): {[string]: TBaseItem} {
    const data = {};
    for (const atomName of this.map.keys()) {
      const value = this.get(atomName, transactionId);
      if (value !== undefined) {
        data[atomName] = value;
      }
    }
    return data;
  }
}

module.exports = TXHashTable;
