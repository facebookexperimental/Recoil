/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

import ConnectionContext from '../ConnectionContext';
import Item from '../Items/Item';
import {useSelectedTransaction} from '../useSelectionHooks';
import SnapshotContext from './SnapshotContext';

import React, {useContext, useMemo} from 'react';

export default function SelectorList(): React$Node {
  const {searchVal} = useContext(SnapshotContext);
  const connection = useContext(ConnectionContext);
  const [txID] = useSelectedTransaction();
  const {snapshot, sortedKeys} = useMemo(() => {
    const localSnapshot = connection?.tree?.getSnapshot(txID);
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
  const filteredSelectors = selectors.filter(({name}) =>
    name.toLowerCase().includes(searchVal.toLowerCase()),
  );

  return (
    <>
      <h2>Selectors</h2>
      {filteredSelectors.length > 0
        ? filteredSelectors.map(({name, content}) => (
            <Item
              isRoot={true}
              name={name}
              node={connection?.getNode(name)}
              content={content}
            />
          ))
        : 'No selectors to show.'}
    </>
  );
}
