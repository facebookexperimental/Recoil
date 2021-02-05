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

const React = require('react');
const {useState} = require('react');

const styles = {
  holder: {
    marginTop: 5,
  },
  labelHovered: {
    background: '#ddd',
  },
  labelRoot: {
    paddingLeft: 16,
  },
  labelHolder: {
    padding: 5,
  },
  hovered: {
    background: '#efefef',
  },
  selectorHolder: {
    height: 5,
    width: 5,
    display: 'inline-block',
    marginRight: 8,
  },
  selector: {
    display: 'inline-block',
    cursor: 'pointer',
  },
  collapsedSelector: {
    borderLeft: '5px solid #bbb',
    borderBottom: '5px solid transparent',
    borderTop: '5px solid transparent',
    transform: 'translate(3px, 1px)',
  },
  expandedSelector: {
    borderTop: '5px solid #bbb',
    borderRight: '5px solid transparent',
    borderLeft: '5px solid transparent',
    transform: 'translate(0px, -1px)',
  },
  valueHolder: {
    marginLeft: '24px',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'stretch',
  },
};

type Props = {
  children?: React.Node,
  label: React.Node,
  collapsible?: boolean,
  startCollapsed?: ?boolean,
  inContainer?: ?boolean,
  isRoot?: ?boolean,
};

const noop = () => {};

function CollapsibleItem({
  children,
  label,
  collapsible = true,
  startCollapsed = true,
  inContainer = false,
  isRoot = false,
}: Props): React.Node {
  const [collapsed, setCollapsed] = useState(startCollapsed);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        ...(inContainer ? {} : styles.holder),
        ...(isHovered ? styles.hovered : {}),
      }}
      onMouseEnter={isRoot ? () => setIsHovered(true) : noop}
      onMouseLeave={isRoot ? () => setIsHovered(false) : noop}>
      <div
        style={{
          ...styles.labelHolder,
          ...(isRoot ? styles.labelRoot : {}),
          ...(isHovered ? styles.labelHovered : {}),
        }}>
        <span style={styles.selectorHolder}>
          {collapsible && (
            <span
              style={{
                ...styles.selector,
                ...styles[collapsed ? 'collapsedSelector' : 'expandedSelector'],
              }}
              onClick={() => setCollapsed(!collapsed)}
            />
          )}
        </span>
        {label}
      </div>
      {!collapsed && children != null && (
        <div style={styles.valueHolder}>{children}</div>
      )}
    </div>
  );
}

module.exports = CollapsibleItem;
