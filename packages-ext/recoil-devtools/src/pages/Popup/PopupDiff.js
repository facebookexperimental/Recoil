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

const ConnectionContext = require('./ConnectionContext');
const DiffItem = require('./Items/DiffItem').default;
const {useSelectedTransaction} = require('./useSelectionHooks');
const React = require('react');
const {useContext} = require('react');

function PopupDiff(): React.Node {
  const connection = useContext(ConnectionContext);

  const [txID] = useSelectedTransaction();

  if (connection == null) {
    return null;
  }

  const transaction = connection.transactions.get(txID);

  return (
    <>
      {transaction?.modifiedValues?.map(({name}) => (
        <DiffItem name={name} key={name} isRoot={true} />
      ))}
    </>
  );
}

module.exports = PopupDiff;
