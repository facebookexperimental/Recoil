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
  DependenciesSnapshotType,
  SnapshotType,
} from '../../types/DevtoolsTypes';

const {
  createGraph,
  flattenLevels,
  createSankeyData,
} = require('../../utils/GraphUtils');
const {
  flowGraphLayout,
  butterflyGraphLayout,
} = require('../../utils/sankey/SankeyGraphLayout');
const React = require('react');
const {useMemo, useState, useContext, useRef, useEffect} = require('react');
const ConnectionContext = require('./ConnectionContext');
const {useSelectedTransaction} = require('./useSelectionHooks');
const nullthrows = require('nullthrows');
const d3 = require('d3');
const Sankey = require('../../utils/sankey/Sankey');

const powerSourceColor = d3.scaleOrdinal(d3.schemeCategory10);

const styles = {
  references: {
    display: 'flex',
    paddingLeft: 16,
  },
  graph: {
    display: 'flex',
  },
  level: {
    marginRight: '30px',
    overflow: 'visible',
  },
  item: {
    padding: '5px 10px 28px',
    position: 'relative',
    textAlign: 'left',
    borderRadius: '3px',
    ':hover': {
      backgroundColor: '#eee',
    },
  },
  itemDecoration: {
    content: '""',
    position: 'absolute',
    backgroundColor: 'green',
    borderRadius: '30px',
    height: '16px',
    width: '16px',
    bottom: '10px',
    left: '10px',
  },
  itemDimmed: {
    opacity: 0.5,
  },
  referenceHolder: {
    marginRight: 24,
    display: 'flex',
    alignItems: 'center',
  },
  referenceColor: {
    marginRight: 10,
    height: 20,
    width: 30,
    border: '1px solid black',
  },
  button: {
    padding: '6px 10px',
    cursor: 'pointer',
  },
};

type ReferenceProps = {
  color: string,
  legend: string,
};

function ColorReference({color, legend}: ReferenceProps): React.Node {
  return (
    <div style={styles.referenceHolder}>
      <span style={{...styles.referenceColor, backgroundColor: color}} />

      <span>{legend}</span>
    </div>
  );
}

function PopupDependencyGraph(): React.Node {
  const connection = nullthrows(useContext(ConnectionContext));
  const [txID] = useSelectedTransaction();
  const [focalNodeKey, setFocalNodeKey] = useState();
  const {edges, nodes} = useMemo(() => {
    const nodeDeps = connection.dependencies.getSnapshot(txID);
    const nodeWeights = connection.nodesState.getSnapshot(txID);
    return createSankeyData(nodeDeps, nodeWeights);
  }, [txID, connection.dependencies, connection.nodesState]);

  const layout = useMemo(() => {
    return focalNodeKey == null
      ? flowGraphLayout({
          nodePadding: '30%',
          nodeAlignment: 'entry',
        })
      : butterflyGraphLayout(focalNodeKey, {
          nodePadding: '30%',
          depthOfField: 1000,
        });
  }, [focalNodeKey]);

  return (
    <>
      <div style={styles.references}>
        <ColorReference color="blue" legend="Atom" />
        <ColorReference color="red" legend="Selector" />
        <ColorReference color="#ccc" legend="Unknown" />
        <button
          style={styles.button}
          disabled={focalNodeKey == null}
          onClick={() => setFocalNodeKey(null)}>
          Reset View
        </button>
      </div>
      <div style={styles.graph}>
        <Sankey
          height={1300}
          width={800}
          margin={20}
          orientation="horizontal"
          nodes={{
            data: nodes,
            getNodeKey: n => n,
            getNodeName: n => (n.length < 25 ? n : `${n.substr(0, 22)}...`),
            getNodeValue: n => 1,
          }}
          links={{
            data: edges,
            getLinkValue: l => l.value,
            getLinkSourceKey: l => l.source,
            getLinkTargetKey: l => l.target,
          }}
          nodeStyles={{
            fill: n => {
              const type = connection.getNode(n.key)?.type;
              return type === 'selector'
                ? 'red'
                : type === 'atom'
                ? 'blue'
                : '#ccc';
            },
            stroke: 'black',
            'shape-rendering': 'crispEdges',
            cursor: 'pointer',
          }}
          nodeLabelStyles={{
            fill: 'darkred',
            'font-weight': 'bold',
            'font-size': 'small',
          }}
          nodeEvents={{
            click: (_evt, node) => setFocalNodeKey(node?.key),
          }}
          layout={layout}
          nodeThickness={20}
          linkStyles={{stroke: 'lightblue', opacity: 0.4}}
          linkColor={l => 'lightblue'}
          getNodeTooltip={n => String(n.key)}
          getLinkTooltip={n =>
            `${n.source?.key ?? ''} => ${n.target?.key ?? ''}`
          }
        />
      </div>
    </>
  );
}

module.exports = PopupDependencyGraph;
