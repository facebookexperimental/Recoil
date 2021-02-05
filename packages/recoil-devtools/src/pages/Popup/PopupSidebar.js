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

import type Connection from '../../utils/Connection';
import type {TransactionType} from '../../types/DevtoolsTypes';

const nullthrows = require('nullthrows');
const Transaction = require('./PopupSidebarTransaction');
const React = require('react');
const {useContext, useMemo} = require('react');
const ConnectionContext = require('./ConnectionContext');
const {useSelectedTransaction} = require('./useSelectionHooks');

const {useFilter} = require('./useSelectionHooks');
const styles = {
  sidebar: {
    backgroundColor: 'white',
    overflowY: 'scroll',
    height: '100%',
    maxHeight: '100%',
    textAlign: 'center',
    width: '30%',
    borderRight: '1px solid #ccc',
    flexShrink: 0,
  },
};

/**
 * @explorer-desc
 * DevTools Popup Sidebar
 */
function Sidebar(): React.MixedElement {
  const connection = useContext(ConnectionContext);
  const [selected, setSelected] = useSelectedTransaction();
  const [filter] = useFilter();
  const allTransactions: TransactionType[] =
    connection?.transactions?.getArray() ?? [];
  const transactions = useMemo(() => {
    if (filter !== '') {
      return allTransactions.filter(tx =>
        tx.modifiedValues.some(
          node => node.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1,
        ),
      );
    }
    return allTransactions;
  }, [filter, allTransactions]);
  return (
    <aside style={styles.sidebar}>
      {transactions.map((tx, i) => (
        <Transaction
          transaction={tx}
          key={tx.id}
          isSelected={tx.id === selected}
          previous={connection?.transactions?.get(tx.id - 1)}
          setSelected={setSelected}
        />
      ))}
    </aside>
  );
}

module.exports = Sidebar;
