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

import React from 'react';

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

export default function NodeName({name, node}: KeyProps): React$MixedElement {
  return (
    <span style={styles.label}>
      {node?.type === 'selector' && (
        <span style={styles.selector} title="This is a Recoil selector">
          S
        </span>
      )}
      {name}
    </span>
  );
}
