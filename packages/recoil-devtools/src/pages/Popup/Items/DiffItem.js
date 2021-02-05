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
import type Connection from '../../../utils/Connection';
import ItemDependencies from './ItemDependencies';

const React = require('react');
const {useMemo} = require('react');
const JsonDiff = require('jsondiffpatch-for-react').default;
const CollapsibleItem = require('./CollapsibleItem');
const ItemLabel = require('./ItemLabel');
const ItemDescription = require('./ItemDescription');
const {formatForDiff} = require('../../../utils/Serialization');
const {useContext} = require('react');
const ConnectionContext = require('../ConnectionContext');
const {useSelectedTransaction} = require('../useSelectionHooks');
const nullthrows = require('nullthrows');
const ItemMoreItems = require('./ItemMoreItems');

const styles = {
  valuesHolder: {
    display: 'flex',
    justifyContent: 'stretch',
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
};

type Props = {
  name: string,
  startCollapsed?: boolean,
  isRoot?: boolean,
};

function DiffItem({
  name,
  startCollapsed = false,
  isRoot = false,
}: Props): React.Node {
  const connection = nullthrows(useContext(ConnectionContext));
  const [txID] = useSelectedTransaction();

  const {tree, dependencies} = connection;
  const {value, previous} = useMemo(
    () => ({
      value: tree.get(name, txID),
      previous: tree.get(name, txID - 1),
    }),
    [tree, txID],
  );

  return (
    <CollapsibleItem
      key={name}
      isRoot={isRoot}
      label={
        <>
          <ItemLabel
            name={name}
            node={connection.getNode(name)}
            isRoot={isRoot}
          />
          <ItemDescription content={value} isDiff={true} previous={previous} />
        </>
      }
      startCollapsed={startCollapsed}>
      <div style={styles.valuesHolder}>
        <JsonDiff left={formatForDiff(previous)} right={formatForDiff(value)} />
      </div>
      <ItemMoreItems content={value} />
      <ItemDependencies name={name} />
    </CollapsibleItem>
  );
}

export default DiffItem;
