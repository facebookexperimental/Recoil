/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
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

const ConnectionContext = require('./ConnectionContext');
const {useSelectedTransaction} = require('./useSelectionHooks');
const AtomList = require('./Snapshot/AtomList.js').default;
const SelectorList = require('./Snapshot/SelectorList.js').default;
const SnapshotSearch = require('./Snapshot/SnapshotSearch.js').default;
const SnapshotContext = require('./Snapshot/SnapshotContext.js').default;
const React = require('react');
const {useContext, useMemo, useState} = require('react');

const styles = {
  container: {
    paddingLeft: 8,
  },
  item: {
    marginBottom: 16,
  },
};

function SnapshotRenderer(): React.Node {
  const [searchVal, setSearchVal] = useState('');
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
    <SnapshotContext.Provider value={{searchVal, setSearchVal}}>
      <div style={styles.container}>
        <SnapshotSearch />
        <AtomList />
        <SelectorList />
      </div>
    </SnapshotContext.Provider>
  );
}

export default SnapshotRenderer;
