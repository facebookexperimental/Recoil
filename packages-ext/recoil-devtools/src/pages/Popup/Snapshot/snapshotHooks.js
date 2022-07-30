/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

import type {SerializedValue} from '../../../utils/Serialization';

import ConnectionContext from '../ConnectionContext';

import {useSelectedTransaction} from '../useSelectionHooks';

import {useContext, useMemo} from 'react';

export const useAtomsList = (): ?Array<NodeInfo> => {
  const connection = useContext(ConnectionContext);
  const [txID] = useSelectedTransaction();
  const {snapshot, sortedKeys} = useMemo(() => {
    const localSnapshot = connection?.tree.getSnapshot(txID);
    return {
      snapshot: localSnapshot,
      sortedKeys: Object.keys(localSnapshot ?? {}).sort(),
    };
  }, [connection, txID]);

  const atoms = useMemo(() => {
    const value = [];
    sortedKeys.forEach(key => {
      const node = connection?.getNode(key);
      const content = snapshot?.[key];
      if (node != null && node.type === 'atom' && content != null) {
        value.push({name: key, content});
      }
    });
    return value;
  }, [connection, snapshot, sortedKeys]);

  if (snapshot == null || connection == null) {
    return null;
  }
  return atoms;
};

type NodeInfo = {
  name: string,
  content: SerializedValue,
};

export const useSelectorsList = (): ?Array<NodeInfo> => {
  const connection = useContext(ConnectionContext);
  const [txID] = useSelectedTransaction();
  const {snapshot, sortedKeys} = useMemo(() => {
    const localSnapshot = connection?.tree.getSnapshot(txID);
    return {
      snapshot: localSnapshot,
      sortedKeys: Object.keys(localSnapshot ?? {}).sort(),
    };
  }, [connection, txID]);

  const selectors = useMemo(() => {
    const value = [];
    sortedKeys.forEach(key => {
      const node = connection?.getNode(key);
      const content = snapshot?.[key];
      if (node != null && node.type === 'selector' && content != null) {
        value.push({name: key, content});
      }
    });
    return value;
  }, [connection, snapshot, sortedKeys]);

  if (snapshot == null || connection == null) {
    return null;
  }
  return selectors;
};
