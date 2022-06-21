/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
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

  if (snapshot == null || connection == null) {
    return null;
  }

  const atoms = [];
  sortedKeys.forEach(key => {
    const node = connection.getNode(key);
    if (node?.type === 'atom') {
      atoms.push({name: key, content: snapshot[key]});
    }
  });

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

  if (snapshot == null || connection == null) {
    return null;
  }

  const selectors = [];
  sortedKeys.forEach(key => {
    const node = connection.getNode(key);
    if (node?.type === 'selector') {
      selectors.push({name: key, content: snapshot[key]});
    }
  });

  return selectors;
};
