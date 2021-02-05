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

const DependencyGraph = require('./PopupDependencyGraph');
const Diff = require('./PopupDiff');
const Snapshot = require('./PopupSnapshot').default;
const Tabs = require('./Tabs');
const React = require('react');
const {useContext} = require('react');
const ConnectionContext = require('./ConnectionContext');
const {MainTabsTitle} = require('../../constants/Constants');

const styles = {
  main: {
    flexGrow: 1,
    textAlign: 'left',
    overflowY: 'hidden',
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'stretch',
    backgroundColor: 'white',
    padding: '16px 0',
    boxSizing: 'border-box',
  },

  header: {
    backgroundColor: '#bbb',
    color: 'white',
    flexGrow: 0,
    flexShrink: 0,
    padding: '10px 16px',
  },

  content: {
    padding: '16px 0',
    flexGrow: 1,
    overflowY: 'scroll',
  },
  head: {
    display: 'flex',
    fontWeight: 'bold',
    paddingLeft: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: '24px',
    marginRight: 16,
  },
};

type Props = $ReadOnly<{
  selectedMainTab: MainTabsType,
}>;

function MainContent({selectedMainTab}: Props): React.Node {
  const connection = useContext(ConnectionContext);
  if (connection == null) {
    return null;
  }
  return (
    <main style={styles.main}>
      <div style={styles.head}>{MainTabsTitle[selectedMainTab]}</div>
      <div style={styles.content}>
        {selectedMainTab === 'Diff' && <Diff />}
        {selectedMainTab === 'State' && <Snapshot />}
        {selectedMainTab === 'Graph' && <DependencyGraph />}
      </div>
    </main>
  );
}

module.exports = MainContent;
