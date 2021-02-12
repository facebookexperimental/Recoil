/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+obviz
 * @flow strict-local
 * @format
 */
'use strict';

import type {LinkData, NodeData} from './Sankey';

const objectValues = require('../ObjectValues').default;
const d3Array = require('d3-array');

export type Key = string | number;

export type Link<L, N> = {
  data: L | Key,
  key: Key,
  value: number,
  source?: Node<N, L>,
  target?: Node<N, L>,
  visible: boolean,
  sourceDepth: number,
  sourcePosition: number,
  targetDepth: number,
  targetPosition: number,
  backedge: boolean,
  fadeSource: boolean,
  fadeTarget: boolean,
};

export type Node<N, L> = {
  data: N | Key,
  +key: Key,
  +name: string,
  value: number,
  depth: number,
  visible: boolean,
  position: number,
  +sourceLinks: Array<Link<L, N>>,
  +targetLinks: Array<Link<L, N>>,
  linkWeight: number,
};

export type Graph<N, L> = $ReadOnly<{
  links: $ReadOnlyArray<Link<L, N>>,
  nodes: $ReadOnlyArray<Node<N, L>>,
}>;

// Utility functions
const sortDesc = <T>(array: Array<T>, accessor: T => number) =>
  array.sort((a, b) => accessor(b) - accessor(a));

// Generate the Node and Link objects for layout.  These may be mutated.
function generateGraph<N, L>({
  nodeData,
  linkData,
}: {
  nodeData?: NodeData<N>,
  linkData: LinkData<L>,
}): Graph<N, L> {
  // Prepare the Nodesx
  const nodesByKey: {[Key]: Node<N, L>} = {};
  if (nodeData != null) {
    for (const n of nodeData.data) {
      const key: Key = nodeData.getNodeKey(n);
      nodesByKey[key] = {
        data: n,
        key,
        name: nodeData.getNodeName(n),
        value: nodeData.getNodeValue?.(n) ?? 0,
        visible: true,
        depth: 0,
        position: 0,
        sourceLinks: [],
        targetLinks: [],
        linkWeight: 0,
      };
    }
  } else {
    // Generate nodes based on the proivded links
    const keys: Set<Key> = new Set();
    for (const l of linkData.data) {
      const linkSourceKey = linkData.getLinkSourceKey(l);
      if (linkSourceKey != null) {
        keys.add(linkSourceKey);
      }
      const linkTargetKey = linkData.getLinkTargetKey(l);
      if (linkTargetKey != null) {
        keys.add(linkTargetKey);
      }
    }
    for (const key of keys) {
      if (key != null) {
        nodesByKey[key] = {
          data: key,
          key,
          name: String(key),
          value: 0,
          visible: true,
          depth: 0,
          position: 0,
          sourceLinks: [],
          targetLinks: [],
          linkWeight: 0,
        };
      }
    }
  }

  // Prepare the Links
  const links: Array<Link<L, N>> = linkData.data.map(l => {
    const sourceKey = linkData.getLinkSourceKey(l);
    const targetKey = linkData.getLinkTargetKey(l);
    const source = sourceKey != null ? nodesByKey[sourceKey] : undefined;
    const target = targetKey != null ? nodesByKey[targetKey] : undefined;
    const link = {
      data: l,
      key: `${sourceKey ?? ''}/${targetKey ?? ''}`,
      value: linkData.getLinkValue(l),
      source,
      target,
      visible: true,
      sourceDepth: 0,
      sourcePosition: 0,
      targetDepth: 0,
      targetPosition: 0,
      backedge: false,
      fadeSource: source == null,
      fadeTarget: target == null,
    };
    link.source?.targetLinks.push(link);
    link.target?.sourceLinks.push(link);
    return link;
  });

  // Only include connected nodes
  const nodes = objectValues(nodesByKey).filter(
    node => node.sourceLinks.length || node.targetLinks.length,
  );

  // Compute the node values
  for (const node of nodes) {
    const sourceWeight: number = d3Array.sum(node.sourceLinks, l => l.value);
    const targetWeight: number = d3Array.sum(node.targetLinks, l => l.value);
    node.value = Math.max(node.value, sourceWeight, targetWeight);
    // Sort links for deterministic back-edge detection
    sortDesc(node.sourceLinks, l => l.value);
    sortDesc(node.targetLinks, l => l.value);
  }

  // Detect Back Edges / Cycles
  sortDesc(nodes, node => node.value); // sort for deterministic back-edge detection
  const visited: {[Key]: boolean} = {};
  for (const node of nodes) {
    if (visited[node.key]) {
      continue;
    }

    const stack: Array<mixed> = [];
    function detectBackedge(node) {
      visited[node.key] = true;
      stack.push(node);
      for (const link of node.targetLinks) {
        link.backedge = stack.indexOf(link.target) !== -1;
        if (link.target != null && !visited[link.target.key]) {
          detectBackedge(link.target);
        }
      }
      stack.pop();
    }
    detectBackedge(node);
  }

  // Return the Graph
  return {links, nodes};
}

function updateVisibility<N, L>(graph: Graph<N, L>, nodesSet: Set<Node<N, L>>) {
  // Update node visibility
  for (const node of graph.nodes) {
    node.visible = false;
  }
  for (const node of nodesSet) {
    node.visible = true;
  }

  // Update link visibility
  for (const link of graph.links) {
    // Set which links point to missing nodes
    link.fadeSource = !link.source?.visible;
    link.fadeTarget = !link.target?.visible;
    link.visible = !link.fadeSource || !link.fadeTarget;
  }
}

module.exports = {
  generateGraph,
  updateVisibility,
};
