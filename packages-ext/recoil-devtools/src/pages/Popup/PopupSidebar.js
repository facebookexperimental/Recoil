/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {TransactionType} from '../../types/DevtoolsTypes';

const ConnectionContext = require('./ConnectionContext');
const Transaction = require('./PopupSidebarTransaction');
const {useSelectedTransaction} = require('./useSelectionHooks');
const {useFilter} = require('./useSelectionHooks');
const React = require('react');
const {useContext, useMemo} = require('react');
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
  const allTransactions: ?Array<TransactionType> =
    connection?.transactions?.getArray();
  const transactions = useMemo(() => {
    if (allTransactions == null) {
      return [];
    }
    return filter !== ''
      ? allTransactions.filter(tx =>
          tx.modifiedValues.some(
            node =>
              node.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1,
          ),
        )
      : allTransactions;
  }, [filter, allTransactions]);

  return (
    <aside style={styles.sidebar}>
      {transactions.map((tx, _index) => (
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
