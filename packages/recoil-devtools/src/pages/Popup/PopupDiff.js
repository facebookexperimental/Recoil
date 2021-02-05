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

const React = require('react');
const DiffItem = require('./Items/DiffItem').default;
const {useContext} = require('react');
const ConnectionContext = require('./ConnectionContext');
const {useSelectedTransaction} = require('./useSelectionHooks');

function PopupDiff(): React.Node {
  const connection = useContext(ConnectionContext);

  const [txID] = useSelectedTransaction();

  if (connection == null) {
    return null;
  }

  const transaction = connection.transactions.get(txID);
  const tree = connection.tree;
  const depsTree = connection.dependencies;

  return (
    <>
      {transaction?.modifiedValues?.map(({name}) => (
        <DiffItem name={name} key={name} isRoot={true} />
      ))}
    </>
  );
}

module.exports = PopupDiff;
