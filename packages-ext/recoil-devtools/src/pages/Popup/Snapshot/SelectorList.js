/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

import ConnectionContext from '../ConnectionContext';
import Item from '../Items/Item';
import {useSelectedTransaction} from '../useSelectionHooks';
import SearchContext from './SearchContext';

import {useSelectorsList} from './snapshotHooks';

import React, {useContext, useMemo} from 'react';

export default function SelectorList(): React$Node {
  const {searchVal} = useContext(SearchContext);
  const connection = useContext(ConnectionContext);
  const selectors = useSelectorsList() ?? [];
  const filteredSelectors = selectors.filter(({name}) =>
    name.toLowerCase().includes(searchVal.toLowerCase()),
  );

  return (
    <>
      <h2>Selectors</h2>
      {filteredSelectors.length > 0
        ? filteredSelectors.map(({name, content}) => (
            <Item
              isRoot={true}
              name={name}
              node={connection?.getNode(name)}
              content={content}
            />
          ))
        : 'No selectors to show.'}
    </>
  );
}
