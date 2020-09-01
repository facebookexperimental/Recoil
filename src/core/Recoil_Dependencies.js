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

import type Graph from 'Recoil_Graph';
import type {NodeKey, Version} from './Recoil_Keys';
import type {Store} from './Recoil_State';

const nullthrows = require('../util/Recoil_nullthrows');

export type DependencyMap = Map<NodeKey, Set<NodeKey>>;

// Note that this overwrites the deps of existing nodes, rather than unioning
// the new deps with the old deps.
function mergeDependencyMapIntoGraph(deps: DependencyMap, graph: Graph): void {
  deps.forEach((parents, child) => graph.setParentsOfNode(child, parents));
}

function saveDependencyMapToStore(
  dependencyMap: DependencyMap,
  store: Store,
  version: Version,
): void {
  // Merge the dependencies discovered into the store's dependency map
  // for the version that was read:
  const graph = store.getGraph(version);
  mergeDependencyMapIntoGraph(dependencyMap, graph);
}

function mergeDepsIntoDependencyMap(
  from: DependencyMap,
  into: DependencyMap,
): void {
  from.forEach((upstreamDeps, downstreamNode) => {
    if (!into.has(downstreamNode)) {
      into.set(downstreamNode, new Set());
    }
    const deps = nullthrows(into.get(downstreamNode));
    upstreamDeps.forEach(dep => deps.add(dep));
  });
}

function addToDependencyMap(
  downstream: NodeKey,
  upstream: NodeKey,
  dependencyMap: DependencyMap,
): void {
  if (!dependencyMap.has(downstream)) {
    dependencyMap.set(downstream, new Set());
  }
  nullthrows(dependencyMap.get(downstream)).add(upstream);
}

module.exports = {
  addToDependencyMap,
  mergeDepsIntoDependencyMap,
  saveDependencyMapToStore,
};
