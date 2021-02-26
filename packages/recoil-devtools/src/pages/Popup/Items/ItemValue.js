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
import type {
  SerializedValue,
  SupportedSerializedValueTypes,
} from '../../../utils/Serialization';

import Item from './Item';

const {SerializedValueType} = require('../../../utils/Serialization');
const React = require('react');

const styles = {
  blockValue: {
    marginTop: 0,
  },
  value: {
    fontWeight: 'bold',
  },
};

type ValueSpanProps = {
  children: React.Node,
};

const ValueSpan = ({children}: ValueSpanProps): React.Node => {
  return <span style={styles.value}>{children}</span>;
};

const ItemRenderers = {
  [SerializedValueType.null]: function SerializedValueTypeNull({}) {
    return <ValueSpan>null</ValueSpan>;
  },
  [SerializedValueType.undefined]: function SerializedValueTypeUndefined({}) {
    return <ValueSpan>undefined</ValueSpan>;
  },
  [SerializedValueType.array]: ({
    value,
    startCollapsed,
  }: {
    value: $ReadOnlyArray<SerializedValue>,
    startCollapsed: ?boolean,
  }) =>
    value.map((it, i) => (
      <Item name={i} content={it} key={i} startCollapsed={startCollapsed} />
    )),

  [SerializedValueType.object]: ({
    value,
    startCollapsed,
  }: {
    value: $ReadOnlyArray<$ReadOnlyArray<SerializedValue>>,
    startCollapsed: ?boolean,
  }) => {
    return ItemRenderers[SerializedValueType.map]({value, startCollapsed});
  },
  [SerializedValueType.set]: ({
    value,
    startCollapsed,
  }: {
    value: $ReadOnlyArray<SerializedValue>,
    startCollapsed: ?boolean,
  }) => {
    return ItemRenderers[SerializedValueType.array]({value, startCollapsed});
  },
  [SerializedValueType.map]: ({
    value,
    startCollapsed,
  }: {
    value: $ReadOnlyArray<$ReadOnlyArray<SerializedValue>>,
    startCollapsed: ?boolean,
  }) => {
    return value.map(([name, content], i) => (
      <Item
        name={name?.v?.toString() ?? i}
        content={content}
        key={i}
        startCollapsed={startCollapsed}
      />
    ));
  },
  [SerializedValueType.date]: function SerializedValueTypeDate({
    value,
  }: {
    value: Date,
  }) {
    return <ValueSpan>{new Date(value).toISOString()}</ValueSpan>;
  },
  [SerializedValueType.function]: function SerializedValueTypeFunction({
    value,
  }: {
    value: string,
  }) {
    return <ValueSpan>{value}</ValueSpan>;
  },
  [SerializedValueType.symbol]: function SerializedValueTypeSymbol({
    value,
  }: {
    value: string,
  }) {
    return <ValueSpan>Symbol({value})</ValueSpan>;
  },
  [SerializedValueType.error]: ({value}: {value: string}) =>
    ItemRenderers[SerializedValueType.primitive]({value}),
  [SerializedValueType.promise]: function SerializedValueTypePromise({
    value,
  }: {
    value: string,
  }) {
    return <ValueSpan>Promise{'<Pending>'}</ValueSpan>;
  },
  [SerializedValueType.primitive]: function SerializedValueTypePrimitive({
    value,
  }: {
    value: string | number,
  }) {
    if (typeof value === 'string') {
      return <ValueSpan>&#34;{value}&#34;</ValueSpan>;
    } else if (typeof value?.toString === 'function') {
      return <ValueSpan>{value.toString()}</ValueSpan>;
    }
    // $FlowFixMe
    return <ValueSpan>{value}</ValueSpan>;
  },
};

type Props = {
  content: ?SerializedValue,
  inline?: boolean,
  startCollapsed?: ?boolean,
};

function ItemValue({
  content,
  inline = false,
  startCollapsed,
}: Props): React.Node {
  let markup =
    content == null
      ? 'undefined'
      : // $FlowFixMe
        ItemRenderers[content.t]({
          // $FlowFixMe
          value: content.v,
          startCollapsed,
        });

  return inline ? markup : <div style={styles.blockValue}>{markup}</div>;
}

export default ItemValue;
