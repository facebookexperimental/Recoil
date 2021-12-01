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

import type {AtomEffect, Loadable, RecoilState, StoreID} from 'Recoil';
import type {Checker} from 'refine';

const {
  DefaultValue,
  RecoilLoadable,
  useRecoilSnapshot,
  useRecoilStoreID,
  useRecoilTransaction_UNSTABLE,
} = require('Recoil');

const React = require('react');
const {useCallback, useEffect, useRef} = require('react');
const err = require('recoil-shared/util/Recoil_err');

type NodeKey = string;
export type ItemKey = string;
export type StoreKey = string | void;

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

type Storage = {
  write?: WriteItems,
  read?: ReadItem,
};

class Registries {
  atomRegistries: Map<
    StoreID,
    Map<
      StoreKey,
      Map<NodeKey, AtomRegistration<any>>, // flowlint-line unclear-type:off
    >,
  > = new Map();

  getAtomRegistry(
    recoilStoreID: StoreID,
    externalStoreKey: StoreKey,
    // flowlint-next-line unclear-type:off
  ): Map<NodeKey, AtomRegistration<any>> {
    if (!this.atomRegistries.has(recoilStoreID)) {
      this.atomRegistries.set(recoilStoreID, new Map());
    }
    const storeRegistries = this.atomRegistries.get(recoilStoreID);
    const registry = storeRegistries?.get(externalStoreKey);
    if (registry != null) {
      return registry;
    }
    const newRegistry = new Map();
    storeRegistries?.set(externalStoreKey, newRegistry);
    return newRegistry;
  }

  storageRegistries: Map<StoreID, Map<StoreKey, Storage>> = new Map();

  getStorage(recoilStoreID: StoreID, externalStoreKey: StoreKey): ?Storage {
    return this.storageRegistries.get(recoilStoreID)?.get(externalStoreKey);
  }

  setStorage(
    recoilStoreID: StoreID,
    externalStoreKey: StoreKey,
    storage: Storage,
  ) {
    if (!this.storageRegistries.has(recoilStoreID)) {
      this.storageRegistries.set(recoilStoreID, new Map());
    }
    this.storageRegistries.get(recoilStoreID)?.set(externalStoreKey, storage);
  }

  clrStorage(recoilStoreID: StoreID, externalStoreKey: StoreKey) {
    this.storageRegistries.get(recoilStoreID)?.delete(externalStoreKey);
  }
}
const registries: Registries = new Registries();

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

const itemsFromSnapshot = (
  recoilStoreID: StoreID,
  storeKey: StoreKey,
  getInfo,
): ItemSnapshot => {
  const items: ItemSnapshot = new Map();
  for (const [, {atom, itemKeys}] of registries.getAtomRegistry(
    recoilStoreID,
    storeKey,
  )) {
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
  storeKey?: StoreKey,
  write?: WriteItems,
  read?: ReadItem,
  listen?: ListenToItems,
};
function useRecoilSync({
  storeKey,
  write,
  read,
  listen,
}: RecoilSyncOptions): void {
  const recoilStoreID = useRecoilStoreID();

  // Subscribe to Recoil state changes
  const snapshot = useRecoilSnapshot();
  const previousSnapshotRef = useRef(snapshot);
  useEffect(() => {
    if (write != null) {
      if (snapshot === previousSnapshotRef.current) {
        return;
      } else {
        previousSnapshotRef.current = snapshot;
      }
      const diff: ItemDiff = new Map();
      const atomRegistry = registries.getAtomRegistry(recoilStoreID, storeKey);
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
                recoilStoreID,
                storeKey,
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
  }, [recoilStoreID, snapshot, storeKey, write]);

  // Subscribe to Sync storage changes
  const updateItems = useRecoilTransaction_UNSTABLE(
    ({set, reset}) =>
      (diff: ItemDiff) => {
        const atomRegistry = registries.getAtomRegistry(
          recoilStoreID,
          storeKey,
        );
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
    [recoilStoreID, storeKey],
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
      const atomRegistry = registries.getAtomRegistry(recoilStoreID, storeKey);
      for (const [, registration] of atomRegistry) {
        for (const [itemKey] of registration.itemKeys) {
          if (!itemSnapshot.has(itemKey)) {
            itemSnapshot.set(itemKey);
          }
        }
      }
      updateItems(itemSnapshot);
    },
    [recoilStoreID, storeKey, updateItems],
  );
  useEffect(
    () =>
      // TODO try/catch errors and set atom to error state if actionOnFailure is errorState
      listen?.({updateItem, updateAllKnownItems}),
    [updateItem, updateAllKnownItems, listen],
  );

  // Register Storage
  // Save before effects so that we can initialize atoms for initial render
  registries.setStorage(recoilStoreID, storeKey, {write, read});
  useEffect(() => {
    registries.setStorage(recoilStoreID, storeKey, {write, read});
    return () => registries.clrStorage(recoilStoreID, storeKey);
  }, [recoilStoreID, storeKey, read, write]);
}

function RecoilSync(props: RecoilSyncOptions): React.Node {
  useRecoilSync(props);
  return null;
}

///////////////////////
// syncEffect()
///////////////////////
export type SyncEffectOptions<T> = {
  storeKey?: StoreKey,
  itemKey?: ItemKey,

  refine: Checker<T>,

  read?: ({read: ReadItem}) => mixed,
  write?: (Loadable<T>, {read: ReadItem}) => ItemDiff,

  // Sync actual default value instead of empty when atom is in default state
  syncDefault?: boolean,

  // If there is a failure reading or refining the value, should the atom
  // silently use the default value or be put in an error state
  actionOnFailure_UNSTABLE?: ActionOnFailure,
};

function syncEffect<T>({
  storeKey,
  itemKey,
  refine,
  syncDefault,
  actionOnFailure_UNSTABLE: actionOnFailure = 'errorState',
}: SyncEffectOptions<T>): AtomEffect<T> {
  return ({node, trigger, storeID, setSelf, getLoadable, getInfo_UNSTABLE}) => {
    const key = itemKey ?? node.key;

    // Register Atom
    const atomRegistry = registries.getAtomRegistry(storeID, storeKey);
    const registration = atomRegistry.get(node.key);
    const entry = {refine, syncDefault, actionOnFailure};
    registration != null
      ? registration.itemKeys.set(key, entry)
      : atomRegistry.set(node.key, {
          atom: node,
          itemKeys: new Map([[key, entry]]),
        });

    if (trigger === 'get') {
      // Initialize Atom value
      const readFromStorage = registries.getStorage(storeID, storeKey)?.read;
      if (readFromStorage != null) {
        try {
          const loadable = readFromStorage(key);
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
      const writeToStorage = registries.getStorage(storeID, storeKey)?.write;
      if (syncDefault === true && writeToStorage != null) {
        setTimeout(() => {
          const loadable = getLoadable(node);
          if (loadable.state === 'hasValue') {
            // TODO Atom syncEffect() Write

            // Lazy load "allItems" only if needed.
            const writeInterface = new Proxy(
              ({
                diff: new Map([[key, loadable]]),
                allItems: (null: any), // flowlint-line unclear-type:off
              }: WriteInterface),
              {
                get: (target, prop) => {
                  if (prop === 'allItems' && target.allItems == null) {
                    target.allItems = itemsFromSnapshot(
                      storeID,
                      storeKey,
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
  registries_FOR_TESTING: registries,
};
