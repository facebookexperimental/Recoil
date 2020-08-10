/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */

'use strict';

import type {NodeKey} from './Recoil_Keys';

export type Graph = $ReadOnly<{
  // TODO rename these properties to be more descriptive and symetric.
  // Upstream Node dependencies
  nodeDeps: Map<NodeKey, Set<NodeKey>>,
  // Downstream Node subscriptions
  nodeToNodeSubscriptions: Map<NodeKey, Set<NodeKey>>,
}>;

export type DependencyMap = Map<NodeKey, Set<NodeKey>>;

module.exports = ({}: {...});
