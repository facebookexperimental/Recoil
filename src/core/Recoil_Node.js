/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {Loadable} from '../adt/Recoil_Loadable';
import type {RecoilValue} from './Recoil_RecoilValue';
import type {NodeKey, Store, TreeState} from './Recoil_State';

const RecoilValueClasses = require('./Recoil_RecoilValueClasses');

const expectationViolation = require('../util/Recoil_expectationViolation');
const recoverableViolation = require('../util/Recoil_recoverableViolation');

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
): RecoilValueClasses.RecoilState<T>;

declare function registerNode<T>(
  node: ReadOnlyNodeOptions<T>,
): RecoilValueClasses.RecoilValueReadOnly<T>;

function registerNode<T>(node: Node<T>): RecoilValue<T> {
  if (nodes.has(node.key)) {
    const message = `Duplicate atom key "${node.key}". This is a FATAL ERROR in
      production. But it is safe to ignore this warning if it occurred because of
      hot module replacement.`;
    // if (__DEV__) {
    //   const isAcceptingUpdate = require('../util/Recoil__debug').isAcceptingUpdate;
    //   if (typeof isAcceptingUpdate !== 'function' || !isAcceptingUpdate()) {
    //     expectationViolation(message, 'recoil');
    //   }
    // } else {
      recoverableViolation(message, 'recoil');
    // }
  }
  nodes.set(node.key, node);

  return node.set == null
    ? new RecoilValueClasses.RecoilValueReadOnly(node.key)
    : new RecoilValueClasses.RecoilState(node.key);
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
