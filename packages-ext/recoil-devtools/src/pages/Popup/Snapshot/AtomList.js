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

export default function AtomsList(): React$Node {
  const {searchVal} = useContext(SnapshotContext);
  const [txID] = useSelectedTransaction();
  const connection = useContext(ConnectionContext);
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

  const atoms = [];
  sortedKeys.forEach(key => {
    const node = connection.getNode(key);
    if (node?.type !== 'selector') {
      atoms.push({name: key, content: snapshot[key]});
    }
  });

  const filteredAtoms = atoms.filter(({name}) =>
    name.toLowerCase().includes(searchVal.toLowerCase()),
  );

  return (
    <>
      <h2>Atoms</h2>
      {filteredAtoms.length > 0
        ? filteredAtoms.map(({name, content}) => (
            <Item
              isRoot={true}
              name={name}
              node={connection?.getNode(name)}
              content={content}
            />
          ))
        : 'No atoms to show.'}
    </>
  );
}
