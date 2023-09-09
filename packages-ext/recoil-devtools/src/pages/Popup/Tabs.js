/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */
'use strict';

const React = require('react');

const styles = {
  tabs: {
    display: 'flex',
  },
  tab: {
    backgroundColor: '#fff',
    padding: '0px 15px',
    display: 'flex',
    height: 36,
    cursor: 'pointer',
    fontSize: '16px',
    alignItems: 'center',
    boxSizing: 'border-box',
    outline: 'none',
    borderRight: '1px solid #ccc',
  },
  tabSelected: {
    backgroundColor: '#1877F2',
    color: 'white',
    fontWeight: 'bold',
  },
};

/**
 * @explorer-desc
 * Selecting options via Tabs
 */
function Tabs<TType: string>({
  tabs,
  selected,
  onSelect,
}: $ReadOnly<{
  tabs: $ReadOnlyArray<TType>,
  selected: TType,
  onSelect: TType => void,
}>): React.Node {
  return (
    <div style={styles.tabs}>
      {tabs.map((tab, i) => {
        return (
          <span
            key={tab}
            style={{
              ...styles.tab,
              ...(tab === selected ? styles.tabSelected : {}),
            }}
            tabIndex={i}
            role="option"
            aria-selected={tab === selected}
            onClick={() => onSelect(tab)}>
            <span>{tab}</span>
          </span>
        );
      })}
    </div>
  );
}

module.exports = Tabs;
