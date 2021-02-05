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
const React = require('react');
const NodeName = require('./NodeName');
const styles = {
  label: {
    marginRight: 5,
    color: '#6A51B2',
    fontSize: 12,
  },
  isRoot: {
    fontSize: 12,
  },
};

type KeyProps = {
  name: string | number,
  node: ?Node,
  isRoot?: ?boolean,
};

function ItemLabel({name, node, isRoot = false}: KeyProps) {
  return (
    <span style={{...styles.label, ...(isRoot ? styles.isRoot : {})}}>
      <NodeName name={name} node={node} />:
    </span>
  );
}

module.exports = ItemLabel;
