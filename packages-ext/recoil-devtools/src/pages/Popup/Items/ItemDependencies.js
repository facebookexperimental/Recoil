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

import Item from './Item';

const {SerializedValueType} = require('../../../utils/Serialization');
const ConnectionContext = require('../ConnectionContext');
const {useSelectedTransaction} = require('../useSelectionHooks');
const CollapsibleItem = require('./CollapsibleItem');
const nullthrows = require('nullthrows');
const React = require('react');
const {useContext} = require('react');

const styles = {
  label: {
    color: '#666',
  },
  container: {
    padding: 6,
    background: 'white',
    marginTop: 6,
    marginBottom: 10,
  },
};

type Props = {
  name: string,
};

function ItemDependencies({name}: Props): React.Node {
  const connection = nullthrows(useContext(ConnectionContext));
  const [txID] = useSelectedTransaction();

  const deps = connection.dependencies.get(name, txID);
  if (deps == null || deps.size === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <CollapsibleItem
        inContainer={true}
        label={
          <span style={styles.label}>
            {deps.size} {deps.size === 1 ? 'dependency' : 'dependencies'}
          </span>
        }>
        <div>
          {Array.from(deps).map(dep => (
            <Item
              key={dep}
              name={dep}
              startCollapsed={true}
              content={
                connection?.tree?.get(dep, txID) ?? {
                  t: SerializedValueType.undefined,
                }
              }
              isRoot={false}
            />
          ))}
        </div>
      </CollapsibleItem>
    </div>
  );
}

export default ItemDependencies;
