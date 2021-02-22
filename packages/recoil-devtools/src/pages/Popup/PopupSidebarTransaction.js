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
import type Connection from '../../utils/Connection';

const React = require('react');
const {useRef, useEffect, useCallback, useContext} = require('react');
const NodeName = require('./Items/NodeName');
const ConnectionContext = require('./ConnectionContext');

const styles = {
  transaction: {
    cursor: 'pointer',
    padding: '10px 16px',
    borderBottom: '1px solid #E0E0E0',
    ':hover': {
      backgroundColor: '#eee',
    },
  },

  transactionSelected: {
    backgroundColor: '#E9F3FF',
  },

  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#666',
  },

  body: {
    textAlign: 'left',
    overflowX: 'scroll',
  },

  subscriber: {
    color: '#666',
    marginRight: 8,
  },
  atom: {
    color: '#6A51B2',
    marginRight: 8,
  },
  gotoButton: {
    border: '1px solid #666',
    borderRadius: 3,
    padding: 2,
    marginLeft: 16,
  },
};

type Props = $ReadOnly<{
  transaction: TransactionType,
  previous: ?TransactionType,
  isSelected: boolean,
  setSelected: number => void,
}>;

const Transaction = ({
  transaction,
  previous,
  isSelected,
  setSelected,
}: Props): React.Node => {
  const connection = useContext(ConnectionContext);

  // When creating a new TX that is selected
  // scroll to make it visible
  const DOMNode = useCallback(
    node => {
      if (isSelected && node !== null) {
        node.scrollIntoView();
      }
    },
    [isSelected],
  );

  const modifiedNodes: React.Node[] = [];
  const subscriberNodes: React.Node[] = [];
  for (let modifiedValue of transaction.modifiedValues) {
    const nextList = modifiedValue.isSubscriber
      ? subscriberNodes
      : modifiedNodes;
    nextList.push(
      <span
        key={modifiedValue.name}
        style={modifiedValue.isSubscriber ? styles.subscriber : styles.atom}>
        <NodeName
          name={modifiedValue.name}
          node={connection?.getNode(modifiedValue.name)}
        />
      </span>,
    );
  }

  const gotoCallback = evt => {
    evt.stopPropagation();
    connection?.goToSnapshot(transaction.id);
    setSelected(transaction.id);
  };

  return (
    <div
      ref={DOMNode}
      style={{
        ...styles.transaction,
        ...(isSelected ? styles.transactionSelected : {}),
      }}
      onClick={() => setSelected(transaction.id)}>
      <div style={styles.itemHeader}>
        {transaction.id >= 0 ? <span>Tx {transaction.id}</span> : <span />}
        <div>
          <span>
            {previous?.ts != null
              ? `${(transaction.ts - previous.ts) / 1000}s`
              : transaction.ts.toTimeString().split(' ')[0]}
          </span>
          {connection?.devMode && transaction.id > 0 && (
            <span style={styles.gotoButton} onClick={gotoCallback}>
              Jump
            </span>
          )}
        </div>
      </div>
      <div style={styles.body}>
        {modifiedNodes}
        <div>{subscriberNodes}</div>
      </div>
    </div>
  );
};

module.exports = Transaction;
