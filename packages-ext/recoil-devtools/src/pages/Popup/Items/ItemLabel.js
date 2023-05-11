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

import type {Node} from '../../../types/DevtoolsTypes';

const {getStyle} = require('../../../utils/getStyle');
const NodeName = require('./NodeName').default;
const React = require('react');
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
  isRoot?: boolean,
};

function ItemLabel({name, node, isRoot = false}: KeyProps): React$MixedElement {
  return (
    <span style={getStyle(styles, {label: true, isRoot})}>
      <NodeName name={name} node={node} />:
    </span>
  );
}

module.exports = ItemLabel;
