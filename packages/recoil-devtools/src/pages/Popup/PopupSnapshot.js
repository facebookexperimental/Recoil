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

import type {SnapshotType} from '../../types/DevtoolsTypes';
import Item from './Items/Item';

const {useContext, useMemo} = require('react');
const ConnectionContext = require('./ConnectionContext');
const {useSelectedTransaction} = require('./useSelectionHooks');

const React = require('react');

const styles = {
  item: {
    marginBottom: 16,
  },
};

function SnapshotRenderer(): React.Node {
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

  const atoms = [];
  const selectors = [];
  sortedKeys.forEach(key => {
    const node = connection.getNode(key);
    const list = node?.type === 'selector' ? selectors : atoms;
    list.push(
      <Item
        isRoot={true}
        name={key}
        key={key}
        content={snapshot[key]}
        node={node}
      />,
    );
  });

  return (
    <div>
      {atoms}
      {selectors}
    </div>
  );
}

export default SnapshotRenderer;
