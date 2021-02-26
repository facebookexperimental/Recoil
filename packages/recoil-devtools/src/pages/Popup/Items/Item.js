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
import type {Node} from '../../../types/DevtoolsTypes';
import type {SerializedValue} from '../../../utils/Serialization';

import ItemDependencies from './ItemDependencies';
import ItemValue from './ItemValue';

const ConnectionContext = require('../ConnectionContext');
const {useSelectedTransaction} = require('../useSelectionHooks');
const CollapsibleItem = require('./CollapsibleItem');
const ItemDescription = require('./ItemDescription');
const {hasItemDescription} = require('./ItemDescription');
const ItemLabel = require('./ItemLabel');
const ItemMoreItems = require('./ItemMoreItems');
const nullthrows = require('nullthrows');
const React = require('react');
const {useContext} = require('react');

type KeyProps = {
  name: string | number,
  content: SerializedValue,
  startCollapsed?: ?boolean,
  node?: ?Node,
  isRoot?: boolean,
};

const noop = () => {};

function Item({
  name,
  content,
  startCollapsed,
  node,
  isRoot = false,
}: KeyProps): React.Node {
  const connection = nullthrows(useContext(ConnectionContext));
  const [txID] = useSelectedTransaction();

  const deps = isRoot
    ? connection.dependencies.get(name.toString(), txID)
    : null;
  const hasDescription = hasItemDescription(content);

  return (
    <CollapsibleItem
      key={name}
      isRoot={isRoot}
      collapsible={hasDescription || (deps != null && deps.size > 0)}
      startCollapsed={startCollapsed}
      label={
        <span>
          <>
            <ItemLabel name={name} node={node} isRoot={isRoot} />
            {hasDescription ? (
              <ItemDescription content={content} />
            ) : (
              <ItemValue
                content={content}
                inline={true}
                startCollapsed={startCollapsed}
              />
            )}
          </>
        </span>
      }>
      <div>
        {hasDescription && (
          <ItemValue content={content} startCollapsed={startCollapsed} />
        )}
        <ItemMoreItems content={content} />
        {isRoot && <ItemDependencies name={name.toString()} />}
      </div>
    </CollapsibleItem>
  );
}

export default Item;
