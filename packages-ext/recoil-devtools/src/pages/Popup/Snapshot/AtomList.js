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
import SnapshotContext from './SnapshotContext';

import {useAtomsList} from './snapshotHooks';

import React, {useContext, useMemo} from 'react';

export default function AtomsList(): React$Node {
  const {searchVal} = useContext(SnapshotContext);
  const connection = useContext(ConnectionContext);
  const atoms = useAtomsList() ?? [];

  const filteredAtoms = atoms.filter(({name}) =>
    name.toLowerCase().includes(searchVal.toLowerCase()),
  );

  return (
    <>
      <h2>Atoms</h2>
      {filteredAtoms.length > 0
        ? filteredAtoms.map(({name, content}) => (
            <Item
              isRoot={true}
              name={name}
              node={connection?.getNode(name)}
              content={content}
            />
          ))
        : 'No atoms to show.'}
    </>
  );
}
