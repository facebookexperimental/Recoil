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

const differenceSets = require('../util/Recoil_differenceSets');
const filterSet = require('../util/Recoil_filterSet');
const nullthrows = require('../util/Recoil_nullthrows');
const unionSets = require('../util/Recoil_unionSets');

const emptySet: Set<NodeKey> = new Set();

class Graph {
  baseGraph: Graph | null;
  parents: Map<NodeKey, Set<NodeKey>> = new Map();
  children: Map<NodeKey, Set<NodeKey>> = new Map();

  /**
   * Recoil dependency graphs utilize a very special form of structural sharing
   * which is intended to INTENTIONALLY cause writes to an older graph to bleed
   * into newer graphs -- the opposite of what is normally wanted with immutable
   * data structures.
   */
  constructor(baseGraph: ?Graph) {
    this.baseGraph = baseGraph ?? null;
  }

  parentsOfNode(node: NodeKey): Set<NodeKey> | void {
    let g = this;
    do {
      const answer = g.parents.get(node);
      if (answer !== undefined) {
        return answer;
      }
    } while ((g = g.baseGraph));
    return undefined;
  }

  _childrenOfNode(node: NodeKey): Set<NodeKey> | void {
    let g = this;
    do {
      const answer = g.children.get(node);
      if (answer !== undefined) {
        return answer;
      }
    } while ((g = g.baseGraph));
    return undefined;
  }

  /**
   * Children are a function of parents. That is, the parents (deps) of a node are
   * discovered during selector evaluation, while the children (subscribers) are
   * computable from parents and are only materialized for performance.
   * Now, deps for a node can be discovered and written not only with the latest
   * graph, but also any ancestor graph. These deps should be visible when reading
   * the latest graph -- unless of course a newer graph also contains deps for
   * that node, which should mask it.
   *
   * Since deps can be written into older graphs, we need to union all subscribers
   * across known versions, then filter by whether the subscriber's deps include
   * the parent in the latest version for which deps are recorded.
   */
  childrenOfNode(node: NodeKey): Set<NodeKey> {
    const ancestors = [];
    let g = this;
    do {
      ancestors.push(g);
    } while ((g = g.baseGraph));
    const potentialSubscribers = unionSets(
      ...ancestors.map(a => a._childrenOfNode(node) ?? emptySet),
    );
    return filterSet(potentialSubscribers, sub => {
      const deps = this.parentsOfNode(sub);
      return deps === undefined ? false : deps.has(node);
    });
  }

  setParentsOfNode(node: NodeKey, parents: Set<NodeKey>): void {
    const existingParents = this.parents.get(node);

    // Update parents:
    this.parents.set(node, new Set(parents));

    // Add new deps to children:
    const children = this.children;
    const addedParents =
      existingParents == null
        ? parents
        : differenceSets(parents, existingParents);
    addedParents.forEach(addedParent => {
      if (!children.has(addedParent)) {
        children.set(addedParent, new Set());
      }
      const existing = nullthrows(children.get(addedParent));
      existing.add(node);
    });

    // Remove removed deps from children:
    if (existingParents) {
      const removedParents = differenceSets(existingParents, parents);
      removedParents.forEach(removedParent => {
        if (!children.has(removedParent)) {
          return;
        }
        const existing = nullthrows(children.get(removedParent));
        existing.delete(node);
        if (existing.size === 0) {
          children.delete(removedParent);
        }
      });
    }
  }

  // We don't yet have a way of knowing which graphs are in use; as a temporary
  // kludge, keep graphs for five generations.
  compactOlderGraphs(): void {
    const next = this.baseGraph;
    const last = next?.baseGraph?.baseGraph;
    if (next && last?.baseGraph) {
      const expired = last.baseGraph;
      if (expired.baseGraph) {
        next.compactOlderGraphs();
      }
      last.parents.forEach((parents, child) => {
        expired.parents.set(child, parents);
      });
      last.children.forEach((children, parent) => {
        expired.children.set(parent, children);
      });
      last.parents = expired.parents;
      last.children = expired.children;
      last.baseGraph = null;
    }
  }
}

module.exports = {Graph};
