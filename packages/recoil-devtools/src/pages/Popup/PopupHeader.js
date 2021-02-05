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

import type {MainTabsType} from '../../constants/Constants';

const {MainTabs} = require('../../constants/Constants');
const Tabs = require('./Tabs');
const React = require('react');
const {useFilter} = require('./useSelectionHooks');

const styles = {
  header: {
    display: 'flex',
    borderBottom: '1px solid #ccc',
    minHeight: 36,
    background: '#E9F3FF',
  },
  filterInput: {
    width: '100%',
    height: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'transparent',
    border: 0,
    paddingLeft: 16,
  },
  sidebar: {
    width: '30%',
    flexShrink: 0,
    flexGrow: 0,
    borderRight: '1px solid #ccc',
  },
  main: {
    flexGrow: 1,
    textAlign: 'left',
    display: 'flex',
  },
};

type Props = $ReadOnly<{
  selectedMainTab: MainTabsType,
  setSelectedMainTab: MainTabsType => void,
}>;

/**
 * @explorer-desc
 * DevTools Popup Header
 */
function PopupHeader({
  selectedMainTab,
  setSelectedMainTab,
}: Props): React.MixedElement {
  const [filter, setFilter] = useFilter();
  return (
    <header style={styles.header}>
      <div style={styles.sidebar}>
        <input
          style={styles.filterInput}
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>
      <div style={styles.main}>
        <Tabs
          tabs={MainTabs}
          selected={selectedMainTab}
          onSelect={setSelectedMainTab}
        />
      </div>
    </header>
  );
}

module.exports = PopupHeader;
