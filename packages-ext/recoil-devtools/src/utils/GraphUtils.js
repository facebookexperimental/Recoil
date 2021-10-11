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
import type {
  DependenciesSetType,
  DependenciesSnapshotType,
  NodesSnapshotType,
  SnapshotType,
} from '../types/DevtoolsTypes';
import type Connection from './Connection';

const nullthrows = require('nullthrows');

function depsHaveChaged(
  prev: ?DependenciesSetType,
  next: DependenciesSetType,
): boolean {
  if (prev == null || next == null) {
    return true;
  }
  if (prev.size !== next.size) {
    return true;
  }
  for (const dep of next) {
    if (!prev.has(dep)) {
      return true;
    }
  }
  return false;
}

function createGraph(
  deps: DependenciesSnapshotType,
): {
  // TODO: define proper types
  levels: $ReadOnlyArray<$ReadOnlyArray<string>>,
  edges: $ReadOnlyArray<mixed>,
} {
  const nodes = new Map();
  const edges = [];
  const levels = [[]];

  let queue = Object.keys(deps);
  let solved;
  let it = 0;
  do {
    it++;
    solved = 0;
    const newQueue = [];
    for (const key of queue) {
      const blockers = deps[key];
      let add = true;
      let level = 0;
      const links = [];

      for (const blocker of blockers) {
        if (nodes.has(blocker)) {
          const info = nodes.get(blocker);
          level = Math.max(level, nullthrows(info)[0] + 1);
          links.push(info);
        } else {
          add = false;
          break;
        }
      }

      if (add) {
        if (!levels[level]) {
          levels[level] = [];
        }
        const coors = [level, levels[level].length];
        nodes.set(key, coors);
        levels[level].push(key);
        links.forEach(link => {
          edges.push([link, coors]);
        });
        solved++;
      } else {
        newQueue.push(key);
      }
    }
    queue = newQueue;
  } while (solved > 0 && queue.length && it < 10);

  return {levels, edges};
}

function flattenLevels(
  levels: $ReadOnlyArray<$ReadOnlyArray<string>>,
): $ReadOnlyArray<{x: number, y: number, name: string}> {
  const result = [];
  levels.forEach((level, x) => {
    level.forEach((name, y) => {
      result.push({x, y, name});
    });
  });

  return result;
}

function createSankeyData(
  deps: DependenciesSnapshotType,
  nodeWeights: NodesSnapshotType,
): {
  nodes: string[],
  edges: $ReadOnlyArray<{value: number, source: string, target: string}>,
} {
  const nodes = Object.keys(deps);
  const edges = nodes.reduce((agg, target) => {
    agg.push(
      ...Array.from(deps[target]).map(source => ({
        value: nodeWeights[source]?.updateCount ?? 1,
        source,
        target,
      })),
    );
    return agg;
  }, []);
  return {nodes, edges};
}

module.exports = {
  createGraph,
  depsHaveChaged,
  flattenLevels,
  createSankeyData,
};
