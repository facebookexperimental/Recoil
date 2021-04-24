/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow
 * @format
 */
'use strict';

import type {SerializedValue} from '../../../utils/Serialization';

const {SerializedValueType} = require('../../../utils/Serialization');
const React = require('react');

const styles = {
  description: {
    color: '#666',
    marginTop: 10,
    marginBottom: 10,
  },
};

type KeyProps = {
  content: ?SerializedValue,
};

const Renderers = {
  [SerializedValueType.map]: (value: number): string =>
    `... ${value} more entries`,
  [SerializedValueType.set]: (value: number): string =>
    `... ${value} more entries`,
  [SerializedValueType.object]: (value: number): string =>
    `... ${value} more keys`,
  [SerializedValueType.array]: (value: number): string =>
    `... ${value} more items`,
};

function ItemMoreItems({content}: KeyProps): React.Node {
  if (
    content == null ||
    !Renderers.hasOwnProperty(content?.t) ||
    content.e == null ||
    content.e === 0
  ) {
    return null;
  }

  // $FlowFixMe: Renderers.hasOwnProperty makes sure this works
  const description = Renderers[content.t](content.e);

  return <div style={styles.description}>{description}</div>;
}

module.exports = ItemMoreItems;
