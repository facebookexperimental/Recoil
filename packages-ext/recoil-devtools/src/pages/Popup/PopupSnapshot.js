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
