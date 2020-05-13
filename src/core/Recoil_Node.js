/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from 'Recoil_Loadable';
import type {RecoilValue} from 'Recoil_RecoilValue';
import type {NodeKey, Store, TreeState} from 'Recoil_State';

const RecoilValueInterface = require('Recoil_RecoilValue');

const expectationViolation = require('expectationViolation');
const recoverableViolation = require('recoverableViolation');

class DefaultValue {}
const DEFAULT_VALUE: DefaultValue = new DefaultValue();

class RecoilValueNotReady extends Error {
  constructor(key: string) {
    super(
      `Tried to set the value of Recoil selector ${key} using an updater function, but it is an async selector in a pending or error state; this is not supported.`,
    );
  }
}

export type ReadOnlyNodeOptions<T> = $ReadOnly<{
  key: NodeKey,

  // Returns the updated state and the loadable value of the node
  get: (Store, TreeState) => [TreeState, Loadable<T>],

  // Store the options for the observation hooks
  // TODO Use proper Flow typing
  // flowlint-next-line unclear-type:off
  options: Object,
}>;

export type ReadWriteNodeOptions<T> = $ReadOnly<{
  ...ReadOnlyNodeOptions<T>,

  // Returns the updated state and the set of nodes actually written
  set: (
    store: Store,
    state: TreeState,
    newValue: T | DefaultValue,
  ) => [TreeState, $ReadOnlySet<NodeKey>],
}>;

type Node<T> = ReadOnlyNodeOptions<T> | ReadWriteNodeOptions<T>;

// flowlint-next-line unclear-type:off
const nodes: Map<string, Node<any>> = new Map();

/* eslint-disable no-redeclare */
declare function registerNode<T>(
  node: ReadWriteNodeOptions<T>,
): RecoilValueInterface.RecoilState<T>;

declare function registerNode<T>(
  node: ReadOnlyNodeOptions<T>,
): RecoilValueInterface.RecoilValueReadOnly<T>;

function registerNode<T>(node: Node<T>): RecoilValue<T> {
  if (nodes.has(node.key)) {
    const message = `Duplicate atom key "${node.key}". This is a FATAL ERROR in
      production. But it is safe to ignore this warning if it occured because of
      hot module replacement.`;
    if (__DEV__) {
      const isAcceptingUpdate = require('__debug').isAcceptingUpdate;
      if (typeof isAcceptingUpdate !== 'function' || !isAcceptingUpdate()) {
        expectationViolation(message, 'recoil');
      }
    } else {
      recoverableViolation(message, 'recoil');
    }
  }
  nodes.set(node.key, node);

  return node.set == null
    ? new RecoilValueInterface.RecoilValueReadOnly(node.key)
    : new RecoilValueInterface.RecoilState(node.key);
}
/* eslint-enable no-redeclare */

class NodeMissingError extends Error {}

// flowlint-next-line unclear-type:off
function getNode(key: NodeKey): Node<any> {
  const node = nodes.get(key);
  if (node == null) {
    throw new NodeMissingError(`Missing definition for RecoilValue: "${key}""`);
  }
  return node;
}

module.exports = {
  nodes,
  registerNode,
  getNode,
  NodeMissingError,
  DefaultValue,
  DEFAULT_VALUE,
  RecoilValueNotReady,
};
