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

import type {DependencyMap, Graph} from './Recoil_GraphTypes';
import type {NodeKey, Version} from './Recoil_Keys';
import type {Store} from './Recoil_State';

const differenceSets = require('../util/Recoil_differenceSets');
const mapMap = require('../util/Recoil_mapMap');
const nullthrows = require('../util/Recoil_nullthrows');
export type {DependencyMap, Graph} from './Recoil_GraphTypes';

function graph(): Graph {
  return {
    nodeDeps: new Map(),
    nodeToNodeSubscriptions: new Map(),
  };
}

function cloneGraph(graph: Graph): Graph {
  return {
    nodeDeps: mapMap(graph.nodeDeps, s => new Set(s)),
    nodeToNodeSubscriptions: mapMap(
      graph.nodeToNodeSubscriptions,
      s => new Set(s),
    ),
  };
}

// Note that this overwrites the deps of existing nodes, rather than unioning
// the new deps with the old deps.
function mergeDepedencyMapIntoGraph(deps: DependencyMap, graph: Graph): void {
  const {nodeDeps, nodeToNodeSubscriptions} = graph;

  deps.forEach((upstreams, downstream) => {
    const existingUpstreams = nodeDeps.get(downstream);

    // Update nodeDeps:
    nodeDeps.set(downstream, new Set(upstreams));

    // Add new deps to nodeToNodeSubscriptions:
    const addedUpstreams =
      existingUpstreams == null
        ? upstreams
        : differenceSets(upstreams, existingUpstreams);
    addedUpstreams.forEach(upstream => {
      if (!nodeToNodeSubscriptions.has(upstream)) {
        nodeToNodeSubscriptions.set(upstream, new Set());
      }
      const existing = nullthrows(nodeToNodeSubscriptions.get(upstream));
      existing.add(downstream);
    });

    // Remove removed deps from nodeToNodeSubscriptions:
    if (existingUpstreams) {
      const removedUpstreams = differenceSets(existingUpstreams, upstreams);
      removedUpstreams.forEach(upstream => {
        if (!nodeToNodeSubscriptions.has(upstream)) {
          return;
        }
        const existing = nullthrows(nodeToNodeSubscriptions.get(upstream));
        existing.delete(downstream);
        if (existing.size === 0) {
          nodeToNodeSubscriptions.delete(upstream);
        }
      });
    }
  });
}

function saveDependencyMapToStore(
  dependencyMap: DependencyMap,
  store: Store,
  version: Version,
): void {
  // Merge the dependencies discovered into the store's dependency map
  // for the version that was read:
  const depsByVersion = store.getState().graphsByVersion;
  if (!depsByVersion.has(version)) {
    depsByVersion.set(version, graph());
  }
  const existingMap = nullthrows(depsByVersion.get(version));
  mergeDepedencyMapIntoGraph(dependencyMap, existingMap);
}

function mergeDepsIntoDependencyMap(
  from: DependencyMap,
  into: DependencyMap,
): void {
  from.forEach((downstreams, upstream) => {
    if (!into.has(upstream)) {
      into.set(upstream, new Set());
    }
    const set = nullthrows(into.get(upstream));
    downstreams.forEach(d => set.add(d));
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
  cloneGraph,
  graph,
  mergeDepsIntoDependencyMap,
  saveDependencyMapToStore,
};
