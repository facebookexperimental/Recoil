/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+obviz
 * @flow strict-local
 * @format
 */
'use strict';

import type {LayoutFunction} from './Sankey';
import type {Graph, Key, Link, Node} from './SankeyGraph';

const compactArray = require('./compactArray').default;
const memoize = require('./CV2_memoize').default;
const {updateVisibility} = require('./SankeyGraph');
const d3Array = require('d3-array');
const d3Collection = require('d3-collection');

type PositionLayoutOptions = {
  // Either a number of pixels to attempt to use between each node.  If there
  // are too many nodes, then fewer pixels may be used.  It can also be a string
  // with a percentage value of the vertical space to use for padding, divided
  // among all of the nodes.  (defaults to 20%)
  nodePadding: number | string,
  // Number of iterations to run the layout algorithm
  iterations: number,
  // Factor to adjust the strength of each iteration (smaller will quiesce faster)
  alpha: number,
  // Factor 0-1 to weight aligning nodes with their targets vs their sources.
  // A Larger number makes big links straigter while a smaller number avoids crossed links
  targetLinksWeight: number,
  // How to sort nodes
  // outward/inward will place larger nodes on either end or the middle in
  // an attempt to avoid crossing links
  sortNodes: 'ascending' | 'descending' | 'outward' | 'inward',
  ...
};

type FlowLayoutOptions = {
  ...PositionLayoutOptions,
  // Limit the number of nodes in the graph.  Links to nodes that are omitted will fade out.
  // Currently this will select a contiguous sub-graph from the root nodes based on
  // following the most heavily weighted links.
  nodeLimit?: number,
  // Set node depth based on depth from entry or fully justify leaf nodes at the deepest side
  nodeAlignment: 'entry' | 'both',
  ...
};

const FLOW_LAYOUT_DEFAULT: FlowLayoutOptions = {
  nodePadding: '20%',
  iterations: 32,
  alpha: 0.99,
  targetLinksWeight: 0.2,
  sortNodes: 'descending',
  nodeAlignment: 'entry',
};

type ButterflyLayoutOptions = {
  ...PositionLayoutOptions,
  // The depth of either callers or callees from the focal node to include in the graph
  depthOfField: number,
  // Limit the number of nodes in the graph.  Links to nodes that are omitted will fade out.
  // Currently this will select a contiguous sub-graph from the root nodes based on
  // following the most heavily weighted links.
  nodeLimit?: number,
  ...
};

const BUTTERFLY_LAYOUT_DEFAULT: ButterflyLayoutOptions = {
  depthOfField: 1,
  nodePadding: '20%',
  iterations: 32,
  alpha: 0.99,
  targetLinksWeight: 0.2,
  sortNodes: 'descending',
};

// Utility functions
const sortAsc = <T>(array: Array<T>, accessor: T => number) =>
  array.sort((a, b) => accessor(a) - accessor(b));
const sortDesc = <T>(array: Array<T>, accessor: T => number) =>
  array.sort((a, b) => accessor(b) - accessor(a));

// Limit the graph to just the top n nodes.
// We could simply sort the nodes and slice the biggest ones.  However, that
// can lead to graphs with disconnected fragments.  Instead, traverse the
// graph from the roots and select nodes connected via the largest links.
function limitNodes<N, L>(
  graph: Graph<N, L>,
  nodeLimit: ?number,
  rootNodes: Array<Node<N, L>> = graph.nodes.filter(
    node => node.sourceLinks.length === 0,
  ),
) {
  if (nodeLimit == null || nodeLimit >= graph.nodes.length) {
    return graph;
  }
  let nodesToAdd = nodeLimit;

  const nodesSet: Set<Node<N, L>> = new Set();
  let nextLinks = rootNodes.flatMap(node =>
    node.targetLinks.concat(node.sourceLinks),
  );
  const consideredLinks: Set<Link<mixed, mixed>> = new Set(nextLinks);

  function addNode(node) {
    if (!nodesToAdd) {
      return;
    }
    nodesSet.add(node);
    const newLinks = node.targetLinks
      .concat(node.sourceLinks)
      .filter(link => !consideredLinks.has(link));
    newLinks.forEach(link => consideredLinks.add(link));
    nextLinks = nextLinks.concat(newLinks);
    nodesToAdd--;
  }

  while (nodesToAdd && nextLinks.length) {
    sortDesc(nextLinks, link => link.value);
    const link = nextLinks.shift();
    for (const node of [link.target, link.source]) {
      if (node && !nodesSet.has(node)) {
        addNode(node);
      }
    }
  }

  updateVisibility(graph, nodesSet);
}

// Traditional Sankey flow layout.
// Assign depths to each node based on how they flow
function flowLayoutNodeDepths<N, L>(
  graph: Graph<N, L>,
  layoutOptions: FlowLayoutOptions,
): [number, number] {
  const visibleNodes = graph.nodes.filter(node => node.visible);
  // Compute the depth of each node
  let remainingNodes = visibleNodes;
  let depth = 0;
  while (remainingNodes.length) {
    const nextNodes = [];
    for (const node of remainingNodes) {
      node.depth = depth;
      for (const targetLink of node.targetLinks.filter(l => !l.backedge)) {
        if (!targetLink.fadeTarget && targetLink.target != null) {
          nextNodes.push(targetLink.target);
        }
      }
    }
    remainingNodes = nextNodes;
    depth++;
  }
  const maxDepth = depth - 1;

  // Right align nodes with no targets if requested
  if (layoutOptions.nodeAlignment === 'both') {
    for (const node of visibleNodes) {
      if (!node.targetLinks.length) {
        node.depth = maxDepth;
      }
    }
  }

  return [0, maxDepth];
}

// Butterfly "caller / callee" style layout.
// Place focal node in the center and fan out callers on the left and callees on the right
function butterflyLayoutNodeDepths<N = {}, L = {}>(
  graph: Graph<N, L>,
  focalNode: Node<N, L>,
  layoutOptions: ButterflyLayoutOptions,
): [number, number] {
  const nodesSet = new Set([focalNode]);
  const depthDomain = [0, 0];

  function addNeighbors(
    node: Node<N, L>,
    direction: 'target' | 'source',
    depth: number,
  ) {
    const neighborLinks =
      direction === 'target' ? node.targetLinks : node.sourceLinks;
    const neighbors = compactArray(
      neighborLinks.map(link =>
        direction === 'target' ? link.target : link.source,
      ),
    );
    const newNodes = [];
    for (const neighbor of neighbors) {
      if (!nodesSet.has(neighbor)) {
        newNodes.push(neighbor);
        neighbor.depth = depth;
        direction === 'target'
          ? (depthDomain[1] = Math.max(depthDomain[1], depth))
          : (depthDomain[0] = Math.min(depthDomain[0], depth));
        nodesSet.add(neighbor);
      }
    }
    if (Math.abs(depth) < layoutOptions.depthOfField) {
      for (const neighbor of newNodes) {
        addNeighbors(
          neighbor,
          direction,
          depth + (direction === 'target' ? 1 : -1),
        );
      }
    }
  }

  focalNode.depth = 0;
  if (layoutOptions.depthOfField >= 1) {
    addNeighbors(focalNode, 'target', 1);
    addNeighbors(focalNode, 'source', -1);
  }

  updateVisibility(graph, nodesSet);

  return [depthDomain[0] - 0.5, depthDomain[1] + 0.5];
}

// After the nodes have been assigned depths use an iterative algorithm to adjust
// their positions so they flow by trying to align connected nodes near each other.
function layoutPositions<N, L>(
  graph: Graph<N, L>,
  layoutOptions: PositionLayoutOptions,
  maxBreadth: number,
): [number, number] {
  const visibleNodes = graph.nodes.filter(node => node.visible);

  // Prepare set of depths
  const depths: Array<
    Array<Node<mixed, mixed>> & {paddingPercent: number, padding: number},
  > = d3Collection
    .nest()
    .key(n => n.depth)
    .entries(visibleNodes)
    .map(g => g.values);
  sortAsc(depths, depth => depth[0]?.depth); // d3.nest().sortKeys() didn't work?

  // Calculate node padding and positions
  // Start by determining the percentage of each column to use for padding
  const {nodePadding} = layoutOptions;
  if (typeof nodePadding === 'number') {
    for (const depth of depths) {
      depth.paddingPercent = Math.max(
        (nodePadding * (depth.length - 1)) / maxBreadth,
        0.8,
      );
    }
  } else if (nodePadding.charAt(nodePadding.length - 1) === '%') {
    for (const depth of depths) {
      depth.paddingPercent =
        depth.length === 1 ? 0 : +nodePadding.slice(0, -1) / 100;
      depth.paddingPercent =
        depth.paddingPercent === 1 ? 0.999 : depth.paddingPercent;
    }
  } else {
    throw new Error(
      `Unsupported nodePadding parameter: ${String(nodePadding)}`,
    );
  }
  // Calculate maximum breadth, including padding
  const maxPosition: number = d3Array.max(
    depths.map(
      depth =>
        d3Array.sum(depth, node => node.value) / (1 - depth.paddingPercent),
    ),
  );
  // Calculate node padding for each depth
  for (const depth of depths) {
    depth.padding =
      depth.length === 1
        ? 0
        : (maxPosition * depth.paddingPercent) / (depth.length - 1);
  }

  // Detect collisions and move nodes to avoid overlap
  function collisionDetection() {
    for (const depth of depths) {
      sortAsc(depth, n => n.position);

      // Push overlapping nodes down
      let position = 0;
      for (const node of depth) {
        const delta = position - node.position;
        if (delta > 0) {
          node.position += delta;
        }
        position = node.position + node.value + depth.padding;
      }

      // If they extend past the edge, then push some nodes back
      const lastNode = depth[depth.length - 1];
      if (lastNode.position + lastNode.value > maxPosition) {
        position = maxPosition;
        for (const node of [...depth].reverse()) {
          const delta = node.position + node.value - position;
          if (delta > 0) {
            node.position -= delta;
          } else {
            break;
          }
          position = node.position - depth.padding;
        }
      }
    }
  }

  // Assign node link weights
  for (const node of visibleNodes) {
    const sourceWeight: number = d3Array.sum(node.sourceLinks, l => l.value);
    const targetWeight: number = d3Array.sum(node.targetLinks, l => l.value);
    node.linkWeight =
      sourceWeight + targetWeight * layoutOptions.targetLinksWeight;
  }

  function layoutLinks() {
    for (const depth of depths) {
      const padding =
        depth.length > 1
          ? depth.padding
          : depth.length === 1
          ? maxPosition - depth[0].value
          : 0;
      for (const node of depth) {
        sortAsc(node.sourceLinks, link => link.source?.position ?? Infinity);
        let trailingPosition = node.position - padding / 2;
        let trailingPadding = padding / (node.sourceLinks.length - 1);
        let position = node.position;
        for (const sourceLink of node.sourceLinks) {
          sourceLink.targetDepth = node.depth;
          sourceLink.targetPosition = position;
          position += sourceLink.value;
          // Trailing link to missing node
          if (sourceLink.fadeSource) {
            sourceLink.sourceDepth = node.depth - 1;
            sourceLink.sourcePosition = trailingPosition;
          }
          trailingPosition += sourceLink.value + trailingPadding;
        }

        sortAsc(node.targetLinks, link => link.target?.position ?? Infinity);
        position = node.position;
        trailingPosition = node.position - padding / 2;
        trailingPadding = padding / (node.targetLinks.length - 1);
        for (const targetLink of node.targetLinks) {
          targetLink.sourceDepth = node.depth;
          targetLink.sourcePosition = position;
          position += targetLink.value;
          // Trailing link to missing node
          if (targetLink.fadeTarget) {
            targetLink.targetDepth = node.depth + 1;
            targetLink.targetPosition = trailingPosition;
          }
          trailingPosition += targetLink.value + trailingPadding;
        }
      }
    }
  }

  // Give nodes and links an initial position
  for (const [i, depth] of depths.entries()) {
    // Sort the nodes
    layoutOptions.sortNodes === 'ascending' ||
    layoutOptions.sortNodes === 'inward'
      ? sortAsc(depth, node => node.value)
      : sortDesc(depth, node => node.value);
    if (
      layoutOptions.sortNodes === 'outward' ||
      layoutOptions.sortNodes === 'inward'
    ) {
      // Arrange nodes for the first depth with large nodes on each end in an
      // attempt to avoid links crossing over each other.
      const newDepthNodes = [
        ...depth.filter((_, i) => !(i % 2)),
        ...depth
          .reverse()
          .slice(depth.length % 2)
          .filter((_, i) => !(i % 2)),
      ];
      for (const [i, node] of newDepthNodes.entries()) {
        depth[i] = node;
      }
    }

    if (!i) {
      let position = 0;
      for (const node of depths[0]) {
        node.position = position;
        position += node.value + depths[0].padding;
      }
    } else {
      // For each subsequent depth, align the nodes to the right of their sources
      // in an attempt for flatter links
      for (const node of depth) {
        let weightedPosition = 0;
        let sourceLinkValue = 0;
        let totalWeightedPosition = 0;
        let totalSourceLinkValue = 0;
        for (const sourceLink of node.sourceLinks) {
          const source = sourceLink.source;
          if (source == null) {
            continue;
          }
          totalWeightedPosition += source.position * sourceLink.value;
          totalSourceLinkValue += sourceLink.value;
          // Only provide initial layout for forward links, not back edges
          if (source.depth >= node.depth) {
            continue;
          }
          weightedPosition += source.position * sourceLink.value;
          sourceLinkValue += sourceLink.value;
        }
        if (sourceLinkValue) {
          node.position = weightedPosition / sourceLinkValue;
        } else if (totalSourceLinkValue) {
          // If all source links were back-edges, then just average them all
          node.position = totalWeightedPosition / totalSourceLinkValue;
        } else {
          // If there are no source links at all, then average the target links
          // This can't happen in a normal Sankey, since all nodes with no
          // sources are in the first depth, but it can happen with a butterfly.
          let targetLinkValue = 0;
          for (const targetLink of node.targetLinks) {
            const target = targetLink.target;
            if (target == null) {
              continue;
            }
            weightedPosition += target.position * targetLink.value;
            targetLinkValue += targetLink.value;
          }
          node.position = weightedPosition / (targetLinkValue || 1);
        }
      }
    }
  }
  collisionDetection();
  layoutLinks();

  // Now iterate on the layout to shift nodes closer to their neighbors
  // based on the values of their links
  let alpha = 1;
  for (let iteration = 0; iteration < layoutOptions.iterations; iteration++) {
    alpha *= layoutOptions.alpha;
    for (const depth of depths) {
      for (const node of depth) {
        let delta = 0;
        for (const sourceLink of node.sourceLinks) {
          // Not back-edges
          if (sourceLink.targetDepth > sourceLink.sourceDepth) {
            delta +=
              (sourceLink.sourcePosition - sourceLink.targetPosition) *
              sourceLink.value;
          }
        }
        for (const targetLink of node.targetLinks) {
          // Not back-edges
          if (targetLink.targetDepth > targetLink.sourceDepth) {
            delta +=
              (targetLink.targetPosition - targetLink.sourcePosition) *
              targetLink.value *
              // Weight alignment with target nodes less, to avoid cross-over
              layoutOptions.targetLinksWeight;
          }
        }
        delta /= node.linkWeight;
        node.position += delta * alpha;
      }
    }
    collisionDetection();
    layoutLinks();
  }

  return [0, maxPosition];
}

const flowGraphLayout = <N, L>(
  layoutOptions: $Shape<FlowLayoutOptions> = FLOW_LAYOUT_DEFAULT,
): LayoutFunction<N, L> => {
  const layoutOptionsConfig = {
    ...FLOW_LAYOUT_DEFAULT,
    ...layoutOptions,
  };

  return ({graph, positionRange}) => {
    limitNodes(graph, layoutOptions.nodeLimit);
    const depthDomain = flowLayoutNodeDepths(graph, layoutOptions);
    const positionDomain = layoutPositions(
      graph,
      layoutOptions,
      positionRange[1],
    );
    return {graph, positionDomain, depthDomain};
  };
};

const butterflyGraphLayout = <N, L>(
  focalNodeKey: Key,
  layoutOptions: $Shape<ButterflyLayoutOptions> = BUTTERFLY_LAYOUT_DEFAULT,
): LayoutFunction<N, L> => {
  const layoutOptionsConfig = {
    ...BUTTERFLY_LAYOUT_DEFAULT,
    ...layoutOptions,
    focalNodeKey,
  };

  return ({graph, positionRange}) => {
    const focalNode = graph.nodes.find(
      n => n.key === layoutOptionsConfig.focalNodeKey,
    );
    if (focalNode == null) {
      throw new Error(
        `Unable to find focal node: ${layoutOptionsConfig.focalNodeKey}`,
      );
    }
    const depthDomain = butterflyLayoutNodeDepths(
      graph,
      focalNode,
      layoutOptionsConfig,
    );
    limitNodes(graph, layoutOptionsConfig.nodeLimit, [focalNode]);
    const positionDomain = layoutPositions(
      graph,
      layoutOptionsConfig,
      positionRange[1],
    );
    return {graph, positionDomain, depthDomain};
  };
};

module.exports = {
  flowGraphLayout,
  butterflyGraphLayout,
};
