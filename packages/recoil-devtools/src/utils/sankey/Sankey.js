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

import type {Events, Styles} from './CV2_D3';
import type {Graph, Key, Link, Node} from './SankeyGraph';

const {select} = require('./CV2_D3');
const {generateGraph} = require('./SankeyGraph');
const d3Interpolate = require('d3-interpolate');
const d3Scale = require('d3-scale');
const React = require('react');
const {useLayoutEffect, useMemo, useRef} = require('react');

export type LinkData<L> = $ReadOnly<{
  data: $ReadOnlyArray<L>,
  getLinkValue: L => number,
  getLinkSourceKey: L => ?Key,
  getLinkTargetKey: L => ?Key,
}>;

// Optional to provide node data if you would like to set node values other
// that that derived from incoming and outgoing links or use names distinct from keys, etc.
export type NodeData<N> = $ReadOnly<{
  data: $ReadOnlyArray<N>,
  getNodeKey: N => Key,
  getNodeName: N => string,
  getNodeValue?: N => number, // If not provided, node value is based on max of incoming or outgoing links
}>;

type Layout<N, L> = $ReadOnly<{
  graph: Graph<N, L>,
  depthDomain: [number, number],
  positionDomain: [number, number],
}>;

export type LayoutFunction<N, L> = ({
  graph: Graph<N, L>,
  positionRange: [number, number],
  depthRange: [number, number],
}) => Layout<N, L>;

type Props<N, L> = $ReadOnly<{
  height: number,
  width: number,
  margin?: number,
  orientation: 'horizontal' | 'vertical',
  layout: LayoutFunction<N, L>,
  links: LinkData<L>, // Input link data
  nodes?: NodeData<N>, // If not provided, nodes are derived from link data
  getNodeTooltip?: (Node<N, L>) => string,
  nodeStyles?: Styles<Node<N, L>>,
  nodeClass?: string | ((Node<N, L>) => string),
  nodeLabelStyles?: Styles<Node<N, L>>,
  nodeLabelClass?: string | ((Node<N, L>) => string),
  nodeEvents?: Events<Node<N, L>>,
  // Height of a node in pixels (x-axis in horizontal, y-axis in vertical orientation)
  nodeThickness?: number,
  // Align node labels
  nodeLabelAlignment?: 'inward' | 'right',
  // Curvature for curved link paths (range 0-1, defaults to 0.5)
  getLinkTooltip?: (Link<L, N>) => string,
  linkColor: string | ((Link<L>) => string),
  linkStyles?: Styles<Link<L, N>>,
  linkClass?: string | ((Link<L, N>) => string),
  linkEvents?: Events<Link<L, N>>,
  linkCurvature?: number,
  // Threshold of link width to thickness when to switch between link path rendering approaches
  // using a spline with width for thin lines vs a filled in path for thick lines
  linkThickPathThreshold?: number,
  valueFormatter?: number => string, // Formatter for values in default tooltips
  animationDurationMS?: number, // Animation duration in ms
  // Optional SVG defs to use for filters and other styling
  defs?: React.Node,
}>;

// Helper to convert something that is either a value or a function to get the
// value to always be a function so we can simply call it to get the value.
// flowlint-next-line unclear-type:off
const functor: <T>(any) => T = <T>(x: T) =>
  typeof x === 'function' ? x : () => x;

/**
 * @explorer-desc
 * Sankey Visualization inspired from https://drarmstr.github.io/chartcollection/examples/#sankey/
 */
function Sankey<N, L>({
  height,
  width,
  margin = 10,
  orientation,
  layout: layoutFunction,
  links: linkData,
  nodes: nodeData,
  getNodeTooltip,
  nodeStyles,
  nodeClass,
  nodeLabelStyles,
  nodeLabelClass,
  nodeEvents,
  nodeThickness = 20,
  nodeLabelAlignment = 'inward',
  getLinkTooltip,
  linkColor,
  linkStyles,
  linkClass,
  linkEvents,
  linkCurvature = 0.5,
  linkThickPathThreshold = 0.75,
  valueFormatter = String,
  animationDurationMS = 2000,
  defs,
}: Props<N, L>): React.MixedElement {
  const ref = useRef<?Element>(null);

  // Chart Size
  const positionRange = useMemo(
    () => [0, (orientation === 'horizontal' ? height : width) - margin * 2],
    [orientation, height, width, margin],
  );
  const depthRange = useMemo(
    () => [
      0,
      (orientation === 'horizontal' ? width : height) -
        nodeThickness -
        margin * 2,
    ],
    [orientation, height, width, margin, nodeThickness],
  );

  // Generate Graph
  const graph = useMemo(
    () => generateGraph<N, L>({nodeData, linkData}),
    [nodeData, linkData],
  );

  // Layout Graph
  const layout = useMemo(
    () =>
      layoutFunction({
        graph,
        positionRange,
        depthRange,
      }),
    [depthRange, graph, layoutFunction, positionRange],
  );

  // Render Sankey via D3
  useLayoutEffect(() => {
    // Setup Scales
    const depth = d3Scale
      .scaleLinear()
      .domain(layout.depthDomain)
      .rangeRound(depthRange);
    const breadth = d3Scale
      .scaleLinear()
      .domain(layout.positionDomain)
      .range(positionRange);

    // Select host <svg>
    if (ref.current == null) {
      return;
    }
    const svg = select(ref.current, {animationDurationMS});

    // Bind Data
    const linksSelection = svg.select('g.links').bind(
      'g.link',
      layout.graph.links.filter(l => l.visible),
      l => l.key,
    );
    const nodesSelection = svg.select('g.nodes').bind(
      'svg.node',
      layout.graph.nodes.filter(n => n.visible),
      n => n.key,
    );

    // Render Nodes
    const nodeDepth = n => depth(n.depth);
    const nodePosition = n => breadth(n.position);
    const nodeWidth = n => breadth(n.value);
    nodesSelection.attr({
      x: orientation === 'horizontal' ? nodeDepth : nodePosition,
      y: orientation === 'horizontal' ? nodePosition : nodeDepth,
      width: orientation === 'horizontal' ? nodeThickness : nodeWidth,
      height: orientation === 'horizontal' ? nodeWidth : nodeThickness,
    });
    // Node Rects
    nodesSelection
      .select('rect')
      .attr({width: '100%', height: '100%', class: nodeClass ?? null})
      .style(nodeStyles)
      .on(nodeEvents);

    // Node Tooltips
    nodesSelection
      .select('title')
      .text(
        getNodeTooltip
          ? n => getNodeTooltip(n)
          : n => `${n.name}\n${valueFormatter(n.value)}`,
      );

    // Render Labels
    const labelsSelection = nodesSelection.select('text').text(n => n.name);
    const labelAlignRight = n =>
      nodeLabelAlignment === 'right' || n.depth <= layout.depthDomain[1] / 2;
    if (orientation === 'horizontal') {
      nodesSelection.style({overflow: 'visible'});
      labelsSelection.attr({
        y: n => nodeWidth(n) / 2,
        x: n => (labelAlignRight(n) ? nodeThickness : 0),
        dx: n => (labelAlignRight(n) ? '0.25em' : '-0.25em'),
        'text-anchor': n => (labelAlignRight(n) ? 'start' : 'end'),
        'dominant-baseline': 'middle',
      });
    } else {
      nodesSelection.style({overflow: 'hidden'});
      labelsSelection.attr({
        x: n => breadth(n.value) / 2,
        dy: nodeThickness / 2,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      });
    }
    labelsSelection
      .attr({class: nodeLabelClass ?? ''})
      .style({'pointer-events': 'none'})
      .style(nodeLabelStyles);

    // Link Tooltips
    linksSelection
      .select('title')
      .html(l =>
        getLinkTooltip
          ? getLinkTooltip(l)
          : `${l.source?.name ?? '[UNKNOWN]'} &nbsp;&#8594;&nbsp; ${
              l.target?.name ?? '[UNKNOWN]'
            }\n${valueFormatter(l.value)}`,
      );

    const isThickCurve = (l: Link<L, N>) => {
      const depthDelta = depth(l.targetDepth) - depth(l.sourceDepth);
      return (
        depthDelta > nodeThickness &&
        breadth(l.value) > depthDelta * linkThickPathThreshold
      );
    };

    // Render Links
    linksSelection
      .select('path')
      .attr({
        d: l => {
          const linkBreadth = breadth(l.value);
          const sourceDepth = depth(l.sourceDepth) + nodeThickness;
          const targetDepth = depth(l.targetDepth);

          // Control point depths to define link curvature
          // Allow back-edges to swoop around
          const isBackEdgeCurve = targetDepth <= sourceDepth;
          const depthInterpolator = d3Interpolate.interpolateRound(
            sourceDepth,
            targetDepth,
          );
          const backEdgeCurvature = isBackEdgeCurve
            ? Math.pow(l.sourceDepth - l.targetDepth, 0.5) + 1
            : 0;
          const sourceControlPointDepth = !isBackEdgeCurve
            ? depthInterpolator(linkCurvature)
            : sourceDepth + (depth(backEdgeCurvature) - depth(0));
          const targetControlPointDepth = !isBackEdgeCurve
            ? depthInterpolator(1 - linkCurvature)
            : targetDepth - (depth(backEdgeCurvature) - depth(0));

          // Browsers can introduce rendering artifacts if curves are too wide,
          // to avoid this, if a link is too thick then outline and fill the path instead.
          if (!isThickCurve(l)) {
            // Browsers may not apply the fade gradient mask properly for a straight
            // path.  In this case, jitter the faded end of the line slightly.
            // (As of Chrome 9/3/20)
            const isStraight =
              breadth(l.sourcePosition).toFixed(3) ===
              breadth(l.targetPosition).toFixed(3);
            const sourcePosition =
              breadth(l.sourcePosition + l.value / 2) +
              (l.fadeSource && isStraight ? 1 : 0);
            const targetPosition =
              breadth(l.targetPosition + l.value / 2) +
              (l.fadeTarget && isStraight ? 1 : 0);
            return orientation === 'horizontal'
              ? `M${sourceDepth},${sourcePosition}` + // Start of curve
                  `C${sourceControlPointDepth},${sourcePosition}` + // First control point
                  ` ${targetControlPointDepth},${targetPosition}` + // Second conrol point
                  ` ${targetDepth},${targetPosition}` // End of curve
              : `M${sourcePosition},${sourceDepth}` + // Start of curve
                  `C${sourcePosition},${sourceControlPointDepth}` + // First control point
                  ` ${targetPosition},${targetControlPointDepth}` + // Second conrol point
                  ` ${targetPosition},${targetDepth}`; // End of curve
          } else {
            const sourcePosition = breadth(l.sourcePosition);
            const targetPosition = breadth(l.targetPosition);
            return orientation === 'horizontal'
              ? `M${sourceDepth},${sourcePosition}` + // Start of curve
                  `C${sourceControlPointDepth},${sourcePosition}` + // First control point
                  ` ${targetControlPointDepth},${targetPosition}` + // Second conrol point
                  ` ${targetDepth},${targetPosition}` + // End of curve
                  `v${linkBreadth}` +
                  `C${targetControlPointDepth},${
                    targetPosition + linkBreadth
                  }` + // Second control point
                  ` ${sourceControlPointDepth},${
                    sourcePosition + linkBreadth
                  }` + // First conrol point
                  ` ${sourceDepth},${sourcePosition + linkBreadth}` +
                  `Z`
              : `M${sourcePosition},${sourceDepth}` + // Start of curve
                  `C${sourcePosition},${sourceControlPointDepth}` + // First control point
                  ` ${targetPosition},${targetControlPointDepth}` + // Second conrol point
                  ` ${targetPosition},${targetDepth}` + // End of curve
                  `h${linkBreadth}` +
                  `C${
                    targetPosition + linkBreadth
                  },${targetControlPointDepth}` + // Second control point
                  ` ${
                    sourcePosition + linkBreadth
                  },${sourceControlPointDepth}` + // First conrol point
                  ` ${sourcePosition + linkBreadth},${sourceDepth}` +
                  `Z`;
          }
        },
        'stroke-width': l =>
          !isThickCurve(l) ? Math.max(1, breadth(l.value)) : 0,
        mask: l =>
          l.fadeSource
            ? 'url(#mask_fade_left)'
            : l.fadeTarget
            ? 'url(#mask_fade_right)'
            : null,
        class: linkClass ?? '',
      })
      .style({
        ...linkStyles,
        fill: l => (isThickCurve(l) ? functor(linkColor)(l) : 'none'),
        stroke: l => (isThickCurve(l) ? 'none' : functor(linkColor)(l)),
        'fill-opacity': l => (isThickCurve(l) ? 1 : 0),
        'stroke-opacity': l => (isThickCurve(l) ? 0 : 1),
      })
      .on(linkEvents);
  }, [
    animationDurationMS,
    layout,
    depthRange,
    getLinkTooltip,
    getNodeTooltip,
    linkClass,
    linkColor,
    linkCurvature,
    linkEvents,
    linkStyles,
    linkThickPathThreshold,
    nodeClass,
    nodeEvents,
    nodeLabelAlignment,
    nodeLabelClass,
    nodeLabelStyles,
    nodeStyles,
    nodeThickness,
    orientation,
    positionRange,
    valueFormatter,
  ]);

  return (
    <svg
      ref={ref}
      height={height}
      width={width}
      viewBox={`${-margin} ${-margin} ${width} ${height}`}>
      <defs>
        <linearGradient id="gradient_for_mask_fade_right">
          <stop offset="0.5" stopColor="white" stopOpacity="1" />
          <stop offset="0.9" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradient_for_mask_fade_left">
          <stop offset="0.1" stopColor="white" stopOpacity="0" />
          <stop offset="0.5" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask
          id="mask_fade_right"
          maskContentUnits="objectBoundingBox"
          x="-1"
          y="-500000%"
          height="1000000%"
          width="2">
          <rect
            x="-1"
            y="-500000"
            height="1000000"
            width="2"
            fill="url(#gradient_for_mask_fade_right)"
          />
        </mask>
        <mask
          id="mask_fade_left"
          maskContentUnits="objectBoundingBox"
          y="-500000%"
          height="1000000%"
          width="2">
          <rect
            y="-500000"
            height="1000000"
            width="2"
            fill="url(#gradient_for_mask_fade_left)"
          />
        </mask>
        {defs}
      </defs>
    </svg>
  );
}

module.exports = Sankey;
