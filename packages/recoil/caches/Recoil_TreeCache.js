/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {
  GetHandlers,
  NodeCacheRoute,
  NodeValueGet,
  SetHandlers,
  TreeCacheBranch,
  TreeCacheLeaf,
  TreeCacheNode,
} from './Recoil_TreeCacheImplementationType';

const err = require('recoil-shared/util/Recoil_err');
const nullthrows = require('recoil-shared/util/Recoil_nullthrows');
const recoverableViolation = require('recoil-shared/util/Recoil_recoverableViolation');

export type Options<T> = {
  mapNodeValue?: (value: mixed) => mixed,
  onHit?: (node: TreeCacheLeaf<T>) => void,
  onSet?: (node: TreeCacheLeaf<T>) => void,
};

class ChangedPathError extends Error {}

class TreeCache<T = mixed> {
  _numLeafs: number;
  _root: TreeCacheNode<T> | null;

  _onHit: $NonMaybeType<Options<T>['onHit']>;
  _onSet: $NonMaybeType<Options<T>['onSet']>;
  _mapNodeValue: $NonMaybeType<Options<T>['mapNodeValue']>;

  constructor(options?: Options<T>) {
    this._numLeafs = 0;
    this._root = null;
    this._onHit = options?.onHit ?? (() => {});
    this._onSet = options?.onSet ?? (() => {});
    this._mapNodeValue = options?.mapNodeValue ?? (val => val);
  }

  size(): number {
    return this._numLeafs;
  }

  // TODO: nodeCount(): number

  root(): TreeCacheNode<T> | null {
    return this._root;
  }

  get(getNodeValue: NodeValueGet, handlers?: GetHandlers<T>): ?T {
    return this.getLeafNode(getNodeValue, handlers)?.value;
  }

  getLeafNode(
    getNodeValue: NodeValueGet,
    handlers?: GetHandlers<T>,
  ): ?TreeCacheLeaf<T> {
    return findLeaf<T>(
      this.root(),
      nodeKey => this._mapNodeValue(getNodeValue(nodeKey)),
      {
        onNodeVisit: node => {
          handlers?.onNodeVisit(node);

          if (node.type === 'leaf') {
            this._onHit(node);
          }
        },
      },
    );
  }

  set(route: NodeCacheRoute, value: T, handlers?: SetHandlers<T>): void {
    let leafNode: TreeCacheLeaf<T>;
    const retryableSet = () => {
      this._root = addLeaf(
        this.root(),
        route.map(([nodeKey, nodeValue]) => [
          nodeKey,
          this._mapNodeValue(nodeValue),
        ]),
        null,
        value,
        null,
        {
          onNodeVisit: node => {
            handlers?.onNodeVisit(node);
            if (node.type === 'leaf') {
              leafNode = node;
            }
          },
        },
      );
    };
    try {
      retryableSet();
    } catch (error) {
      if (error instanceof ChangedPathError) {
        // If the cache was stale or observed inconsistent values, then clear
        // it and rebuild with the new values.
        this.clear();
        retryableSet();
      } else {
        throw error;
      }
    }

    this._numLeafs++;
    this._onSet(nullthrows(leafNode, 'Error adding to selector cache'));
  }

  delete(node: TreeCacheNode<T>): boolean {
    const root = this.root();
    if (!root) {
      return false;
    }

    const existsInTree = pruneNodeFromTree(root, node);
    if (!existsInTree) {
      return false;
    }

    if (node === root || (root.type === 'branch' && !root.branches.size)) {
      this._root = null;
      this._numLeafs = 0;

      return true;
    }

    this._numLeafs -= countDownstreamLeaves(node);
    return true;
  }

  clear(): void {
    this._numLeafs = 0;
    this._root = null;
  }
}

const findLeaf = <T>(
  root: ?TreeCacheNode<T>,
  getNodeValue: NodeValueGet,
  handlers?: GetHandlers<T>,
): ?TreeCacheLeaf<T> => {
  if (root == null) {
    return undefined;
  }

  handlers?.onNodeVisit?.(root);

  if (root.type === 'leaf') {
    return root;
  }

  const nodeValue = getNodeValue(root.nodeKey);
  return findLeaf(root.branches.get(nodeValue), getNodeValue, handlers);
};

// Returns the current or replaced root node.
const addLeaf = <T>(
  root: ?TreeCacheNode<T>,
  route: NodeCacheRoute,
  parent: ?TreeCacheBranch<T>,
  value: T,
  branchKey: ?mixed,
  handlers?: SetHandlers<T>,
): TreeCacheNode<T> => {
  let node;

  // New cache route, make new nodes
  if (root == null) {
    if (route.length === 0) {
      node = {type: 'leaf', value, parent, branchKey};
    } else {
      const [[nodeKey, nodeValue], ...rest] = route;
      node = {
        type: 'branch',
        nodeKey,
        parent,
        branches: new Map(),
        branchKey,
      };

      node.branches.set(
        nodeValue,
        addLeaf(null, rest, node, value, nodeValue, handlers),
      );
    }

    // Follow an existing cache route
  } else {
    node = root;

    const changedPathError =
      'Invalid cache values.  This happens when selectors do not return ' +
      'consistent values for the same input dependency values.  That may be ' +
      'caused when using Fast Refresh to change a selector implementation.';

    if (route.length) {
      const [[nodeKey, nodeValue], ...rest] = route;

      if (node.type !== 'branch' || node.nodeKey !== nodeKey) {
        recoverableViolation(changedPathError + '  Resetting cache.', 'recoil');
        throw new ChangedPathError();
      }

      node.branches.set(
        nodeValue,
        addLeaf(
          node.branches.get(nodeValue),
          rest,
          node,
          value,
          nodeValue,
          handlers,
        ),
      );
    } else {
      if (node.type !== 'leaf' || node.branchKey !== branchKey) {
        if (__DEV__) {
          throw err(changedPathError);
        }
        recoverableViolation(changedPathError + '  Resetting cache.', 'recoil');
        throw new ChangedPathError();
      }
    }
  }

  handlers?.onNodeVisit?.(node);
  return node;
};

// Returns true if node was deleted from the tree
const pruneNodeFromTree = <T>(
  root: TreeCacheNode<T>,
  node: TreeCacheNode<T>,
): boolean => {
  const {parent} = node;
  if (!parent) {
    return root === node;
  }

  parent.branches.delete(node.branchKey);

  return pruneUpstreamBranches(root, parent);
};

const pruneUpstreamBranches = <T>(
  root: TreeCacheNode<T>,
  branchNode: TreeCacheBranch<T>,
): boolean => {
  const {parent} = branchNode;
  if (!parent) {
    return root === branchNode;
  }

  if (branchNode.branches.size === 0) {
    parent.branches.delete(branchNode.branchKey);
  }

  return pruneUpstreamBranches(root, parent);
};

const countDownstreamLeaves = <T>(node: TreeCacheNode<T>): number =>
  node.type === 'leaf'
    ? 1
    : Array.from(node.branches.values()).reduce(
        (sum, currNode) => sum + countDownstreamLeaves(currNode),
        0,
      );

module.exports = {TreeCache};
