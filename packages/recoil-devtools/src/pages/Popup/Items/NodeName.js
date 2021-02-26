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

const styles = {
  label: {
    display: 'inline-block',
    alignItems: 'center',
  },
  selector: {
    marginRight: 5,
    fontSize: 8,
    background: 'red',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: 24,
    padding: '1px 2px',
    verticalAlign: 'middle',
  },
};

type KeyProps = {
  name: string | number,
  node: ?Node,
};

function NodeName({name, node}: KeyProps) {
  return (
    <span style={styles.label}>
      {node?.type === 'selector' && <span style={styles.selector}>S</span>}
      {name}
    </span>
  );
}

module.exports = NodeName;
