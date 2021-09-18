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

// TODO UPDATE IMPORTS TO USE PUBLIC INTERFACE

import type {Loadable} from '../../adt/Recoil_Loadable';
import type {RecoilState} from '../../core/Recoil_RecoilValue';
import type {AtomEffect} from '../../recoil_values/Recoil_atom';

const {useRecoilSnapshot} = require('../../hooks/Recoil_Hooks');
const {useEffect} = require('react');

type NodeKey = string;
export type ItemKey = string;
export type SyncKey = string | void;

export type AtomDiff = Map<ItemKey, ?Loadable<mixed>>;
type Store = Map<ItemKey, ?Loadable<mixed>>;
type ReadItem = ItemKey => ?Loadable<mixed>;

type AtomRegistration = {
  atom: RecoilState<any>, // flowlint-line unclear-type:off
  itemKey: ItemKey,
  options: mixed,
};

class Registries {
  registries: Map<SyncKey, Map<NodeKey, AtomRegistration>> = new Map();

  getAtomRegistry(syncKey: SyncKey): Map<NodeKey, AtomRegistration> {
    const registry = this.registries.get(syncKey);
    if (registry != null) {
      return registry;
    }
    const newRegistry = new Map();
    this.registries.set(syncKey, newRegistry);
    return newRegistry;
  }
}
const registries = new Registries();

type Storage = {
  read?: ReadItem,
};
const storages: Map<SyncKey, Storage> = new Map();

function useRecoilSync({
  syncKey,
  write,
  read,
  listen,
}: {
  syncKey?: SyncKey,
  write?: ({diff: AtomDiff, store: Store}) => void,
  read?: ReadItem,
  listen?: ((AtomDiff) => void) => () => void,
}): void {
  // Subscribe to Recoil state changes
  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    if (write != null) {
      const diff: AtomDiff = new Map();
      const atomRegistry = registries.getAtomRegistry(syncKey);
      const modifiedAtoms = snapshot.getNodes_UNSTABLE({isModified: true});
      for (const atom of modifiedAtoms) {
        const registration = atomRegistry.get(atom.key);
        if (registration != null) {
          const atomInfo = snapshot.getInfo_UNSTABLE(registration.atom);
          // TODO syncEffect()'s write()
          diff.set(
            registration.itemKey,
            atomInfo.isSet ? atomInfo.loadable : null,
          );
        }
      }
      // TODO store
      write({diff, store: diff});
    }
  }, [snapshot, syncKey, write]);

  // Subscribe to Sync storage changes
  // function handleListen(diff: AtomDiff) {}
  // useEffect(() => listen?.(handleListen));

  // Register Storage
  // Save before effects so that we can initialize atoms for initial render
  storages.set(syncKey, {read});
  useEffect(() => {
    return () => void storages.delete(syncKey);
  }, [syncKey]);
}

function syncEffect<SyncItemOptions, T, V = T>({
  syncKey,
  key,
  options,
}: {
  syncKey?: SyncKey,
  key?: ItemKey,
  options?: SyncItemOptions,

  validate: mixed => ?Loadable<V>,
  upgrade?: V => T,

  read?: ({read: ReadItem}) => mixed,
  write?: (Loadable<T>, {read: ReadItem}) => AtomDiff,
}): AtomEffect<T> {
  return ({node, setSelf}) => {
    const itemKey = key ?? node.key;

    // Register Atom
    const atomRegistry = registries.getAtomRegistry(syncKey);
    atomRegistry.set(node.key, {atom: node, itemKey, options});

    // Initialize Atom value
    const readFromStorage = storages.get(syncKey)?.read;
    if (readFromStorage != null) {
      const loadable = readFromStorage(itemKey);
      if (loadable != null) {
        if (loadable.state == null) {
          throw new Error('Sync read must provide a Loadable');
        }
        if (loadable.state === 'hasError') {
          throw loadable.contents;
        }

        switch (loadable.state) {
          case 'hasValue':
            // $FlowFixMe TODO with validation
            setSelf(loadable.contents);
            break;

          case 'hasError':
            throw loadable.contents;

          case 'loading':
            // $FlowFixMe TODO with validation
            setSelf(loadable.toPromise());
            break;
        }
      }
    }
  };
}

module.exports = {
  useRecoilSync,
  syncEffect,
};
