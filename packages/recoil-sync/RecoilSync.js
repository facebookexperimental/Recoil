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

import type {AtomEffect, Loadable, RecoilState} from 'Recoil';
import type {Checker} from 'refine';

const {
  DefaultValue,
  RecoilLoadable,
  useRecoilSnapshot,
  useRecoilTransaction_UNSTABLE,
} = require('Recoil');

const err = require('./util/RecoilSync_err');
const React = require('react');
const {useCallback, useEffect} = require('react');

type NodeKey = string;
export type ItemKey = string;
export type SyncKey = string | void;

// $FlowIssue[unclear-type]
export type ItemDiff = Map<ItemKey, ?Loadable<any>>; // null means reset
export type ItemSnapshot = Map<ItemKey, ?Loadable<mixed>>; // null means default
export type ReadItem = ItemKey => ?Loadable<mixed>;
type WriteInterface = {diff: ItemDiff, allItems: ItemSnapshot};
export type WriteItems = WriteInterface => void;
export type ListenInterface = {
  updateItem: (ItemKey, ?Loadable<mixed>) => void,
  updateAllKnownItems: ItemSnapshot => void,
};
export type ListenToItems = ListenInterface => void | (() => void);
type ActionOnFailure = 'errorState' | 'defaultValue';

const DEFAULT_VALUE = new DefaultValue();

type AtomRegistration<T> = {
  atom: RecoilState<T>,
  itemKeys: Map<
    ItemKey,
    {
      refine: Checker<T>,
      syncDefault?: boolean,
      actionOnFailure: ActionOnFailure,
    },
  >,
  // In-flight updates to avoid feedback loops
  pendingUpdate?: {value: mixed | DefaultValue},
};

// TODO Scope this per <RecoilRoot>
class Registries {
  atomRegistries: Map<
    SyncKey,
    Map<NodeKey, AtomRegistration<any>>, // flowlint-line unclear-type:off
  > = new Map();

  getAtomRegistry(
    syncKey: SyncKey,
    // flowlint-next-line unclear-type:off
  ): Map<NodeKey, AtomRegistration<any>> {
    const registry = this.atomRegistries.get(syncKey);
    if (registry != null) {
      return registry;
    }
    const newRegistry = new Map();
    this.atomRegistries.set(syncKey, newRegistry);
    return newRegistry;
  }
}
const registries = new Registries();

type Storage = {
  write?: WriteItems,
  read?: ReadItem,
};
const storages: Map<SyncKey, Storage> = new Map();

const validateLoadable = <T>(
  loadable: Loadable<mixed>,
  {
    refine,
    actionOnFailure,
  }: {refine: Checker<T>, actionOnFailure: ActionOnFailure, ...},
): Loadable<T | DefaultValue> =>
  loadable.map<T | DefaultValue>(x => {
    const result = refine(x);
    if (result.type === 'success') {
      return result.value;
    }
    if (actionOnFailure === 'defaultValue') {
      return new DefaultValue();
    }
    throw err(`[${result.path.toString()}]: ${result.message}`);
  });

const itemsFromSnapshot = (syncKey, getInfo): ItemSnapshot => {
  const items: ItemSnapshot = new Map();
  for (const [, {atom, itemKeys}] of registries.getAtomRegistry(syncKey)) {
    // TODO syncEffect()'s write()
    for (const [itemKey, {syncDefault}] of itemKeys) {
      const atomInfo = getInfo(atom);
      items.set(
        itemKey,
        atomInfo.isSet || syncDefault === true ? atomInfo.loadable : null,
      );
    }
  }
  return items;
};

///////////////////////
// useRecoilSync()
///////////////////////
type RecoilSyncOptions = {
  syncKey?: SyncKey,
  write?: WriteItems,
  read?: ReadItem,
  listen?: ListenToItems,
};
function useRecoilSync({
  syncKey,
  write,
  read,
  listen,
}: RecoilSyncOptions): void {
  // Subscribe to Recoil state changes
  const snapshot = useRecoilSnapshot();
  useEffect(() => {
    if (write != null) {
      const diff: ItemDiff = new Map();
      const atomRegistry = registries.getAtomRegistry(syncKey);
      const modifiedAtoms = snapshot.getNodes_UNSTABLE({isModified: true});
      for (const atom of modifiedAtoms) {
        const registration = atomRegistry.get(atom.key);
        if (registration != null) {
          const atomInfo = snapshot.getInfo_UNSTABLE(registration.atom);
          // Avoid feedback loops:
          // Don't write to storage updates that came from listening to storage
          if (
            !(
              (atomInfo.isSet &&
                atomInfo.loadable?.contents ===
                  registration.pendingUpdate?.value) ||
              (!atomInfo.isSet &&
                registration.pendingUpdate?.value instanceof DefaultValue)
            )
          ) {
            // TODO syncEffect()'s write()
            for (const [itemKey, {syncDefault}] of registration.itemKeys) {
              diff.set(
                itemKey,
                atomInfo.isSet || syncDefault === true
                  ? atomInfo.loadable
                  : null,
              );
            }
          }
          delete registration.pendingUpdate;
        }
      }
      // Lazy load "allItems" only if needed.
      const writeInterface = new Proxy(
        ({diff, allItems: (null: any)}: WriteInterface), // flowlint-line unclear-type:off
        {
          get: (target, prop) => {
            if (prop === 'allItems' && target.allItems == null) {
              target.allItems = itemsFromSnapshot(
                syncKey,
                snapshot.getInfo_UNSTABLE,
              );
            }
            return target[prop];
          },
        },
      );
      if (diff.size) {
        write(writeInterface);
      }
    }
  }, [snapshot, syncKey, write]);

  // Subscribe to Sync storage changes
  const updateItems = useRecoilTransaction_UNSTABLE(
    ({set, reset}) =>
      (diff: ItemDiff) => {
        const atomRegistry = registries.getAtomRegistry(syncKey);
        for (const [, registration] of atomRegistry) {
          let resetAtom = false;
          // Go through registered item keys in reverse order so later syncEffects
          // take priority if multiple keys are specified for the same storage
          for (const [itemKey, entry] of Array.from(
            registration.itemKeys,
          ).reverse()) {
            if (diff.has(itemKey)) {
              // null entry means to reset atom, but let's first check if there
              // is a fallback syncEffect for the same storage with another key
              // that may provide backup instructions.
              resetAtom = true;
            }
            const loadable = diff.get(itemKey);
            if (loadable != null) {
              resetAtom = false;
              const validated = validateLoadable(loadable, entry);
              switch (validated.state) {
                case 'hasValue':
                  registration.pendingUpdate = {
                    value: validated.contents,
                  };
                  set(registration.atom, validated.contents);
                  break;
                case 'hasError':
                  if (entry.actionOnFailure === 'errorState') {
                    // TODO Async atom support to allow setting atom to error state
                    // in the meantime we can just reset it to default value...
                    registration.pendingUpdate = {value: DEFAULT_VALUE};
                    reset(registration.atom);
                  }
                  break;
                case 'loading':
                  // TODO Async atom support
                  throw err(
                    'Recoil does not yet support setting atoms to an asynchronous state',
                  );
              }
              break;
            }
          }
          if (resetAtom) {
            registration.pendingUpdate = {value: DEFAULT_VALUE};
            reset(registration.atom);
          }
        }
      },
    [syncKey],
  );
  const updateItem = useCallback(
    (itemKey: ItemKey, loadable: ?Loadable<mixed>) => {
      updateItems(new Map([[itemKey, loadable]]));
    },
    [updateItems],
  );
  const updateAllKnownItems = useCallback(
    itemSnapshot => {
      // Reset the value of any items that are registered and not included in
      // the user-provided snapshot.
      const atomRegistry = registries.getAtomRegistry(syncKey);
      for (const [, registration] of atomRegistry) {
        for (const [itemKey] of registration.itemKeys) {
          if (!itemSnapshot.has(itemKey)) {
            itemSnapshot.set(itemKey);
          }
        }
      }
      updateItems(itemSnapshot);
    },
    [syncKey, updateItems],
  );
  useEffect(
    () =>
      // TODO try/catch errors and set atom to error state if actionOnFailure is errorState
      listen?.({updateItem, updateAllKnownItems}),
    [updateItem, updateAllKnownItems, listen],
  );

  // Register Storage
  // Save before effects so that we can initialize atoms for initial render
  storages.set(syncKey, {write, read});
  useEffect(() => () => void storages.delete(syncKey), [syncKey]);
}

function RecoilSync(props: RecoilSyncOptions): React.Node {
  useRecoilSync(props);
  return null;
}

///////////////////////
// syncEffect()
///////////////////////
export type SyncEffectOptions<T> = {
  syncKey?: SyncKey,
  key?: ItemKey,

  refine: Checker<T>,

  read?: ({read: ReadItem}) => mixed,
  write?: (Loadable<T>, {read: ReadItem}) => ItemDiff,

  // Sync actual default value instead of empty when atom is in default state
  syncDefault?: boolean,

  // If there is a failure reading or refining the value, should the atom
  // silently use the default value or be put in an error state
  actionOnFailure?: ActionOnFailure,
};

function syncEffect<T>({
  syncKey,
  key,
  refine,
  syncDefault,
  actionOnFailure = 'errorState',
}: SyncEffectOptions<T>): AtomEffect<T> {
  return ({node, trigger, setSelf, getLoadable, getInfo_UNSTABLE}) => {
    const itemKey = key ?? node.key;

    // Register Atom
    const atomRegistry = registries.getAtomRegistry(syncKey);
    const registration = atomRegistry.get(node.key);
    const entry = {refine, syncDefault, actionOnFailure};
    registration != null
      ? registration.itemKeys.set(itemKey, entry)
      : atomRegistry.set(node.key, {
          atom: node,
          itemKeys: new Map([[itemKey, entry]]),
        });

    if (trigger === 'get') {
      // Initialize Atom value
      const readFromStorage = storages.get(syncKey)?.read;
      if (readFromStorage != null) {
        try {
          const loadable = readFromStorage(itemKey);
          if (loadable != null) {
            if (!RecoilLoadable.isLoadable(loadable)) {
              throw err('Sync read must provide a Loadable');
            }

            const validated = validateLoadable<T>(loadable, {
              refine,
              actionOnFailure,
            });
            switch (validated.state) {
              case 'hasValue':
                if (!(validated.contents instanceof DefaultValue)) {
                  setSelf(validated.contents);
                }
                break;
              case 'hasError':
                if (actionOnFailure === 'errorState') {
                  throw validated.contents;
                }
                break;
              case 'loading':
                setSelf(validated.toPromise());
                break;
            }
          }
        } catch (error) {
          if (actionOnFailure === 'errorState') {
            throw error;
          }
        }
      }

      // Persist on Initial Read
      const writeToStorage = storages.get(syncKey)?.write;
      if (syncDefault === true && writeToStorage != null) {
        setTimeout(() => {
          const loadable = getLoadable(node);
          if (loadable.state === 'hasValue') {
            // TODO Atom syncEffect() Write

            // Lazy load "allItems" only if needed.
            const writeInterface = new Proxy(
              ({
                diff: new Map([[itemKey, loadable]]),
                allItems: (null: any), // flowlint-line unclear-type:off
              }: WriteInterface),
              {
                get: (target, prop) => {
                  if (prop === 'allItems' && target.allItems == null) {
                    target.allItems = itemsFromSnapshot(
                      syncKey,
                      getInfo_UNSTABLE,
                    );
                  }
                  return target[prop];
                },
              },
            );

            writeToStorage(writeInterface);
          }
        }, 0);
      }
    }

    // Unregister atom
    return () => {
      atomRegistry.delete(node.key);
    };
  };
}

module.exports = {
  useRecoilSync,
  RecoilSync,
  syncEffect,
};
