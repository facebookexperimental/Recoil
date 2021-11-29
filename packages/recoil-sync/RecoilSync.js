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

const err = require('./util/RecoilSync_err');
const React = require('react');
const {useCallback, useEffect, useRef} = require('react');

type NodeKey = string;
export type ItemKey = string;
export type StoreKey = string | void;

// $FlowIssue[unclear-type]
export type ItemDiff = Map<ItemKey, ?Loadable<any>>; // null means reset
export type ItemSnapshot = Map<ItemKey, ?Loadable<mixed>>; // null means default
export type ReadItem = ItemKey => ?Loadable<mixed>;
export type WriteInterface = {diff: ItemDiff, allItems: ItemSnapshot};
export type WriteItem = <T>(ItemKey, ?Loadable<T>) => void;
export type WriteItems = WriteInterface => void;
export type UpdateItem = <T>(ItemKey, ?Loadable<T>) => void;
export type UpdateAllKnownItems = ItemSnapshot => void;
export type ListenInterface = {
  updateItem: UpdateItem,
  updateAllKnownItems: UpdateAllKnownItems,
};
export type ListenToItems = ListenInterface => void | (() => void);
type ActionOnFailure = 'errorState' | 'defaultValue';

const DEFAULT_VALUE = new DefaultValue();

type AtomSyncOptions<T> = {
  ...SyncEffectOptions<T>,
  // Mark some items as required
  itemKey: ItemKey,
  read: ReadAtom,
  write: WriteAtom<T>,
};
type AtomRegistration<T> = {
  atom: RecoilState<T>,
  itemKeys: Map<ItemKey, AtomSyncOptions<T>>,
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
  {refine, actionOnFailure_UNSTABLE}: AtomSyncOptions<T>,
): Loadable<T | DefaultValue> =>
  loadable.map<T | DefaultValue>(x => {
    const result = refine(x);
    if (result.type === 'success') {
      return result.value;
    }
    if (actionOnFailure_UNSTABLE === 'defaultValue') {
      return new DefaultValue();
    }
    throw err(`[${result.path.toString()}]: ${result.message}`);
  });

function writeAtomItems<T>(
  diff: ItemDiff,
  options: AtomSyncOptions<T>,
  readFromStorage?: ReadItem,
  loadable: ?Loadable<T>,
) {
  const readFromStorageRequired =
    readFromStorage ??
    (_ =>
      RecoilLoadable.error(
        `Read functionality not provided for ${
          options.storeKey != null ? `"${options.storeKey}" ` : ''
        }store in useRecoilSync() hook while writing item "${
          options.itemKey
        }".`,
      ));
  const read = itemKey =>
    diff.has(itemKey) ? diff.get(itemKey) : readFromStorageRequired(itemKey);
  const write = <S>(k, l: ?Loadable<S>) => void diff.set(k, l);
  options.write({write, read}, loadable);
  return diff;
}

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
    for (const [, opt] of itemKeys) {
      const atomInfo = getInfo(atom);
      writeAtomItems(
        items,
        opt,
        registries.getStorage(recoilStoreID, storeKey)?.read,
        atomInfo.isSet || opt.syncDefault === true ? atomInfo.loadable : null,
      );
    }
  }
  return items;
};

function writeInterfaceItems(
  recoilStoreID: StoreID,
  storeKey: StoreKey,
  diff: ItemDiff,
  getInfo,
): WriteInterface {
  // Use a Proxy so we only generate `allItems` if it's actually used
  return new Proxy(
    ({diff, allItems: (null: any)}: WriteInterface), // flowlint-line unclear-type:off
    {
      get: (target, prop) => {
        if (prop === 'allItems' && target.allItems == null) {
          target.allItems = itemsFromSnapshot(recoilStoreID, storeKey, getInfo);
        }
        return target[prop];
      },
    },
  );
}

///////////////////////
// useRecoilSync()
///////////////////////
export type RecoilSyncOptions = {
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
            (atomInfo.isSet &&
              atomInfo.loadable?.contents !==
                registration.pendingUpdate?.value) ||
            (!atomInfo.isSet &&
              !(registration.pendingUpdate?.value instanceof DefaultValue))
          ) {
            for (const [, options] of registration.itemKeys) {
              writeAtomItems(
                diff,
                options,
                read,
                atomInfo.isSet || options.syncDefault === true
                  ? atomInfo.loadable
                  : null,
              );
            }
          }
          delete registration.pendingUpdate;
        }
      }
      if (diff.size) {
        write(
          writeInterfaceItems(
            recoilStoreID,
            storeKey,
            diff,
            snapshot.getInfo_UNSTABLE,
          ),
        );
      }
    }
  }, [read, recoilStoreID, snapshot, storeKey, write]);

  // Subscribe to Sync storage changes
  const updateItems = useRecoilTransaction_UNSTABLE(
    ({set, reset}) =>
      (diff: ItemDiff) => {
        const atomRegistry = registries.getAtomRegistry(
          recoilStoreID,
          storeKey,
        );
        // TODO syncEffect() read
        for (const [, registration] of atomRegistry) {
          let resetAtom = false;
          // Go through registered item keys in reverse order so later syncEffects
          // take priority if multiple keys are specified for the same storage
          for (const [itemKey, options] of Array.from(
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
              const validated = validateLoadable(loadable, options);
              switch (validated.state) {
                case 'hasValue':
                  registration.pendingUpdate = {
                    value: validated.contents,
                  };
                  set(registration.atom, validated.contents);
                  break;
                case 'hasError':
                  if (options.actionOnFailure_UNSTABLE === 'errorState') {
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
    <T>(itemKey: ItemKey, loadable: ?Loadable<T>) => {
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
export type ReadAtomInterface = {read: ReadItem};
export type ReadAtom = ReadAtomInterface => ?Loadable<mixed>;
export type WriteAtomInterface = {write: WriteItem, read: ReadItem};
export type WriteAtom<T> = (WriteAtomInterface, ?Loadable<T>) => void;

export type SyncEffectOptions<T> = {
  storeKey?: StoreKey,
  itemKey?: ItemKey,

  refine: Checker<T>,

  read?: ReadAtom,
  write?: WriteAtom<T>,

  // Sync actual default value instead of empty when atom is in default state
  syncDefault?: boolean,

  // If there is a failure reading or refining the value, should the atom
  // silently use the default value or be put in an error state
  actionOnFailure_UNSTABLE?: ActionOnFailure,
};

function syncEffect<T>(opt: SyncEffectOptions<T>): AtomEffect<T> {
  return ({node, trigger, storeID, setSelf, getLoadable, getInfo_UNSTABLE}) => {
    const itemKey = opt.itemKey ?? node.key;
    const options: AtomSyncOptions<T> = {
      itemKey,
      read: ({read}) => read(itemKey),
      write: ({write}, loadable) => write(itemKey, loadable),
      syncDefault: false,
      actionOnFailure_UNSTABLE: 'errorState',
      ...opt,
    };
    const {storeKey} = options;
    const storage = registries.getStorage(storeID, storeKey);

    // Register Atom
    const atomRegistry = registries.getAtomRegistry(storeID, storeKey);
    const registration = atomRegistry.get(node.key);
    registration != null
      ? registration.itemKeys.set(itemKey, options)
      : atomRegistry.set(node.key, {
          atom: node,
          itemKeys: new Map([[itemKey, options]]),
        });

    if (trigger === 'get') {
      // Initialize Atom value
      const readFromStorage = storage?.read;
      if (readFromStorage != null) {
        try {
          const loadable = options.read({read: readFromStorage});
          if (loadable != null) {
            if (!RecoilLoadable.isLoadable(loadable)) {
              throw err('Sync read must provide a Loadable');
            }

            const validated = validateLoadable<T>(loadable, options);
            switch (validated.state) {
              case 'hasValue':
                if (!(validated.contents instanceof DefaultValue)) {
                  setSelf(validated.contents);
                }
                break;
              case 'hasError':
                if (options.actionOnFailure_UNSTABLE === 'errorState') {
                  throw validated.contents;
                }
                break;
              case 'loading':
                setSelf(validated.toPromise());
                break;
            }
          }
        } catch (error) {
          if (options.actionOnFailure_UNSTABLE === 'errorState') {
            throw error;
          }
        }
      }

      // Persist on Initial Read
      const writeToStorage = storage?.write;
      if (options.syncDefault === true && writeToStorage != null) {
        setImmediate(() => {
          const loadable = getLoadable(node);
          if (loadable.state === 'hasValue') {
            const diff = writeAtomItems(
              new Map(),
              options,
              storage?.read,
              loadable,
            );
            writeToStorage(
              writeInterfaceItems(storeID, storeKey, diff, getInfo_UNSTABLE),
            );
          }
        });
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
