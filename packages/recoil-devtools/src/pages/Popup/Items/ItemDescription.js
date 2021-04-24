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

import type {
  SerializedValue,
  SupportedSerializedValueTypes,
} from '../../../utils/Serialization';

const {SerializedValueType} = require('../../../utils/Serialization');
const React = require('react');

const styles = {
  description: {
    color: 'red',
  },
  previous: {
    backgroundColor: 'red',
    color: 'white',
    marginRight: 10,
    padding: '2px 4px',
    borderRadius: 3,
    textDecoration: 'line-through',
  },
};

type KeyProps = {
  content: ?SerializedValue,
  previous?: ?SerializedValue,
};

function totalLength(content: SerializedValue): number {
  return (content.v?.length ?? 0) + (content.e ?? 0);
}

const ItemDescriptionRenderers = {
  [SerializedValueType.error]: (): string => `Error`,
  [SerializedValueType.map]: (value: SerializedValue): string =>
    `Map ${totalLength(value)} entries`,
  [SerializedValueType.set]: (value: SerializedValue): string =>
    `Set ${totalLength(value)} entries`,
  [SerializedValueType.object]: (value: SerializedValue): string =>
    `{} ${totalLength(value)} keys`,
  [SerializedValueType.array]: (value: SerializedValue): string =>
    `[] ${totalLength(value)} items`,
  [SerializedValueType.function]: (): string => `Function`,
  [SerializedValueType.symbol]: (): string => `Symbol`,
};

function ItemDescription({content}: KeyProps): React.Node {
  if (content == null || !hasItemDescription(content)) {
    return null;
  }

  // $FlowFixMe: hasItemDescription makes sure this works
  const description = ItemDescriptionRenderers[content.t](content);

  return <span style={styles.description}>{description}</span>;
}

const hasItemDescription = function (content: ?SerializedValue): boolean {
  return ItemDescriptionRenderers.hasOwnProperty(content?.t);
};

module.exports = ItemDescription;
module.exports.hasItemDescription = hasItemDescription;
