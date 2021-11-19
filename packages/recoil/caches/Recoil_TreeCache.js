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

const nullthrows = require('recoil-shared/util/Recoil_nullthrows');
const recoverableViolation = require('recoil-shared/util/Recoil_recoverableViolation');

export type Options<T> = {
  mapNodeValue?: (value: mixed) => mixed,
  onHit?: (node: TreeCacheLeaf<T>) => void,
  onSet?: (node: TreeCacheLeaf<T>) => void,
};

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
    let newRoot = null;
    const setRetryablePart = () => {
      newRoot = addLeaf(
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
        () => {
          this.clear();
          setRetryablePart();
        },
      );
    };
    setRetryablePart();

    if (!this.root()) {
      this._root = newRoot;
    }

    this._numLeafs++;
    this._onSet(nullthrows(leafNode));
  }

  delete(node: TreeCacheNode<T>): boolean {
    if (!this.root()) {
      return false;
    }

    const root = nullthrows(this.root());
    const existsInTree = pruneNodeFromTree(root, node, node.parent);

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

const addLeaf = <T>(
  root: ?TreeCacheNode<T>,
  route: NodeCacheRoute,
  parent: ?TreeCacheBranch<T>,
  value: T,
  branchKey: ?mixed,
  handlers?: SetHandlers<T>,
  onAbort: () => void,
): TreeCacheNode<T> => {
  let node;

  if (root == null) {
    if (route.length === 0) {
      node = {type: 'leaf', value, parent, branchKey};
    } else {
      const [path, ...rest] = route;
      const [nodeKey, nodeValue] = path;

      node = {
        type: 'branch',
        nodeKey,
        parent,
        branches: new Map(),
        branchKey,
      };

      node.branches.set(
        nodeValue,
        addLeaf(null, rest, node, value, nodeValue, handlers, onAbort),
      );
    }
  } else {
    node = root;

    if (route.length) {
      const [path, ...rest] = route;
      const [nodeKey, nodeValue] = path;

      if (root.type !== 'branch' || root.nodeKey !== nodeKey) {
        recoverableViolation(
          'Existing cache must have a branch midway through the ' +
            'route with matching node key. Resetting cache.',
          'recoil',
        );
        onAbort();
        return node; // ignored
      }

      root.branches.set(
        nodeValue,
        addLeaf(
          root.branches.get(nodeValue),
          rest,
          root,
          value,
          nodeValue,
          handlers,
          onAbort,
        ),
      );
    }
  }

  handlers?.onNodeVisit?.(node);

  return node;
};

const pruneNodeFromTree = <T>(
  root: TreeCacheNode<T>,
  node: TreeCacheNode<T>,
  parent: ?TreeCacheBranch<T>,
): boolean => {
  if (!parent) {
    return root === node;
  }

  parent.branches.delete(node.branchKey);

  return pruneUpstreamBranches(root, parent, parent.parent);
};

const pruneUpstreamBranches = <T>(
  root: TreeCacheNode<T>,
  branchNode: TreeCacheBranch<T>,
  parent: ?TreeCacheBranch<T>,
): boolean => {
  if (!parent) {
    return root === branchNode;
  }

  if (branchNode.branches.size === 0) {
    parent.branches.delete(branchNode.branchKey);
  }

  return pruneUpstreamBranches(root, parent, parent.parent);
};

const countDownstreamLeaves = <T>(node: TreeCacheNode<T>): number =>
  node.type === 'leaf'
    ? 1
    : Array.from(node.branches.values()).reduce(
        (sum, currNode) => sum + countDownstreamLeaves(currNode),
        0,
      );

module.exports = {TreeCache};
