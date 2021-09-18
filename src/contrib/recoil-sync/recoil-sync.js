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

const {isLoadable} = require('../../adt/Recoil_Loadable');
const {DefaultValue} = require('../../core/Recoil_Node');
const {
  useRecoilSnapshot,
  useRecoilTransaction,
} = require('../../hooks/Recoil_Hooks');
const {useEffect} = require('react');

type NodeKey = string;
export type ItemKey = string;
export type SyncKey = string | void;

export type AtomDiff = Map<ItemKey, ?Loadable<mixed>>;
export type ReadItem = ItemKey => ?Loadable<mixed>;
export type UpdateItems = AtomDiff => void;
export type Restore<T> = mixed => ?Loadable<T>;

type AtomRegistration<T> = {
  atom: RecoilState<T>,
  itemKeys: Map<ItemKey, {restore: Restore<T>}>,
};

class Registries {
  // flowlint-next-line unclear-type:off
  registries: Map<SyncKey, Map<NodeKey, AtomRegistration<any>>> = new Map();

  getAtomRegistry(
    syncKey: SyncKey,
    // flowlint-next-line unclear-type:off
  ): Map<NodeKey, AtomRegistration<any>> {
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

const validateLoadable = <T>(
  loadable: Loadable<mixed>,
  {restore}: {restore: mixed => ?Loadable<T>},
): Loadable<T | DefaultValue> =>
  loadable.map<mixed, T | DefaultValue>(x => restore(x) ?? new DefaultValue());

///////////////////////
// useRecoilSync()
///////////////////////
function useRecoilSync({
  syncKey,
  write,
  read,
  listen,
}: {
  syncKey?: SyncKey,
  write?: ({diff: AtomDiff}) => void,
  read?: ReadItem,
  listen?: UpdateItems => void | (() => void),
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
          for (const [itemKey] of registration.itemKeys) {
            diff.set(itemKey, atomInfo.isSet ? atomInfo.loadable : null);
          }
        }
      }
      write({diff});
    }
  }, [snapshot, syncKey, write]);

  // Subscribe to Sync storage changes
  const handleListen = useRecoilTransaction(
    ({set, reset}) => (diff: AtomDiff) => {
      const atomRegistry = registries.getAtomRegistry(syncKey);
      for (const [key, loadable] of diff) {
        for (const [, registration] of atomRegistry) {
          const cbs = registration.itemKeys.get(key);
          if (cbs != null) {
            if (loadable != null) {
              const validated = validateLoadable(loadable, cbs);
              switch (validated.state) {
                case 'hasValue':
                  set(registration.atom, validated.contents);
                  break;
                case 'hasError':
                  // TODO Async atom support to allow setting atom to error state
                  // in the meantime we can just reset it to default value...
                  reset(registration.atom);
                  break;
                case 'loading':
                  // TODO Async atom support
                  throw new Error(
                    'Recoil does not yet support setting atoms to an asynchronous state',
                  );
              }
            } else {
              reset(registration.atom);
            }
          }
        }
      }
    },
    [syncKey],
  );
  useEffect(() => listen?.(handleListen), [handleListen, listen]);

  // Register Storage
  // Save before effects so that we can initialize atoms for initial render
  storages.set(syncKey, {read});
  useEffect(() => () => void storages.delete(syncKey), [syncKey]);
}

///////////////////////
// syncEffect()
///////////////////////
function syncEffect<T>({
  syncKey,
  key,
  restore,
}: {
  syncKey?: SyncKey,
  key?: ItemKey,

  restore: mixed => ?Loadable<T>,

  read?: ({read: ReadItem}) => mixed,
  write?: (Loadable<T>, {read: ReadItem}) => AtomDiff,
}): AtomEffect<T> {
  return ({node, setSelf}) => {
    const itemKey = key ?? node.key;

    // Register Atom
    const atomRegistry = registries.getAtomRegistry(syncKey);
    const registration = atomRegistry.get(node.key);
    registration != null
      ? registration.itemKeys.set(itemKey, {restore})
      : atomRegistry.set(node.key, {
          atom: node,
          itemKeys: new Map([[itemKey, {restore}]]),
        });

    // Initialize Atom value
    const readFromStorage = storages.get(syncKey)?.read;
    if (readFromStorage != null) {
      const loadable = readFromStorage(itemKey);
      if (loadable != null) {
        if (!isLoadable(loadable)) {
          throw new Error('Sync read must provide a Loadable');
        }
        if (loadable.state === 'hasError') {
          throw loadable.contents;
        }

        const validated = validateLoadable<T>(loadable, {restore});
        switch (validated.state) {
          case 'hasValue':
            if (!(validated.contents instanceof DefaultValue)) {
              setSelf(validated.contents);
            }
            break;
          case 'hasError':
            throw validated.contents;
          case 'loading':
            setSelf(validated.toPromise());
            break;
        }
      }
    }

    // TODO Unregister atom
  };
}

module.exports = {
  useRecoilSync,
  syncEffect,
};
