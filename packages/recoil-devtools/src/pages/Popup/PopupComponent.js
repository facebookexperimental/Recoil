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

import type {TransactionType} from '../../types/DevtoolsTypes';

const {RecoilDevToolsActions} = require('../../constants/Constants');
const Header = require('./PopupHeader');
const Main = require('./PopupMainContent');
const Sidebar = require('./PopupSidebar');
const React = require('react');
const {useEffect, useState, useContext} = require('react');
const {debug} = require('../../utils/Logger');
const ConnectionContext = require('./ConnectionContext');
const {useSelectedTransaction} = require('./useSelectionHooks');

const styles = {
  app: {
    textAlign: 'center',
    display: 'flex',
    height: '100vh',
    flexDirection: 'column',
    padding: '0',
    boxSizing: 'border-box',
  },
  notFound: {
    marginTop: 16,
  },
  body: {
    display: 'flex',
    flexGrow: 1,
    overflow: 'hidden',
  },
};

type Props = $ReadOnly<{
  maxTransactionId: number,
}>;

const PopupComponent = ({maxTransactionId}: Props): React.Node => {
  const connection = useContext(ConnectionContext);

  const [selectedTX, setSelectedTX] = useSelectedTransaction();
  useEffect(() => {
    // when a new transaction is detected and the previous one was selected
    // move to the new transaction
    if (maxTransactionId - 1 === selectedTX) {
      setSelectedTX(maxTransactionId);
    }
  }, [maxTransactionId, selectedTX, setSelectedTX]);

  // when switching connections, move to the last transaction
  useEffect(() => {
    if (connection != null) {
      setSelectedTX(connection.transactions.getLast());
    }
  }, [connection, setSelectedTX]);

  const [selectedMainTab, setSelectedMainTab] = useState('Diff');

  if (connection == null) {
    return (
      <div style={styles.app}>
        <div style={styles.notFound}>No Recoil connection found.</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <Header
        selectedMainTab={selectedMainTab}
        setSelectedMainTab={setSelectedMainTab}
      />
      <div style={styles.body}>
        <Sidebar />
        <Main selectedMainTab={selectedMainTab} />
      </div>
    </div>
  );
};
module.exports = PopupComponent;
