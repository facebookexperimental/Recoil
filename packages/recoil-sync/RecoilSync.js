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
type EffectKey = number;

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

function setIntersectsMap<U, V>(a: Set<U>, b: Map<U, V>): boolean {
  if (a.size <= b.size) {
    for (const x of a) {
      if (b.has(x)) {
        return true;
      }
    }
  } else {
    for (const x of b.keys()) {
      if (a.has(x)) {
        return true;
      }
    }
  }
  return false;
}

type AtomSyncOptions<T> = {
  ...SyncEffectOptions<T>,
  // Mark some items as required
  itemKey: ItemKey,
  read: ReadAtom,
  write: WriteAtom<T>,
};
type EffectRegistration<T> = {
  options: AtomSyncOptions<T>,
  subscribedItemKeys: Set<ItemKey>,
};
type AtomRegistration<T> = {
  atom: RecoilState<T>,
  effects: Map<EffectKey, EffectRegistration<T>>,
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
  nextEffectKey: EffectKey = 0;

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

  setAtomEffect<T>(
    recoilStoreID: StoreID,
    externalStoreKey: StoreKey,
    node: RecoilState<T>,
    options: AtomSyncOptions<T>,
  ): () => void {
    const atomRegistry = this.getAtomRegistry(recoilStoreID, externalStoreKey);
    if (!atomRegistry.has(node.key)) {
      atomRegistry.set(node.key, {atom: node, effects: new Map()});
    }
    const effectKey = this.nextEffectKey++;
    atomRegistry.get(node.key)?.effects.set(effectKey, {
      options,
      subscribedItemKeys: new Set([options.itemKey]),
    });
    return () => void atomRegistry.get(node.key)?.effects.delete(effectKey);
  }

  storageRegistries: Map<StoreID, Map<StoreKey, Storage>> = new Map();

  getStorage(recoilStoreID: StoreID, externalStoreKey: StoreKey): ?Storage {
    return this.storageRegistries.get(recoilStoreID)?.get(externalStoreKey);
  }

  setStorage(
    recoilStoreID: StoreID,
    externalStoreKey: StoreKey,
    storage: Storage,
  ): () => void {
    if (!this.storageRegistries.has(recoilStoreID)) {
      this.storageRegistries.set(recoilStoreID, new Map());
    }
    this.storageRegistries.get(recoilStoreID)?.set(externalStoreKey, storage);
    return () =>
      void this.storageRegistries.get(recoilStoreID)?.delete(externalStoreKey);
  }
}
const registries: Registries = new Registries();

function validateLoadable<T>(
  loadable: Loadable<mixed>,
  {refine, actionOnFailure_UNSTABLE}: AtomSyncOptions<T>,
): Loadable<T | DefaultValue> {
  if (!RecoilLoadable.isLoadable(loadable)) {
    throw err('Sync read must provide a Loadable');
  }
  return loadable.map<T | DefaultValue>(x => {
    const result = refine(x);
    if (result.type === 'success') {
      return result.value;
    }
    if (actionOnFailure_UNSTABLE === 'defaultValue') {
      return new DefaultValue();
    }
    throw err(`[${result.path.toString()}]: ${result.message}`);
  });
}

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
  for (const [, {atom, effects}] of registries.getAtomRegistry(
    recoilStoreID,
    storeKey,
  )) {
    for (const [, {options}] of effects) {
      const atomInfo = getInfo(atom);
      writeAtomItems(
        items,
        options,
        registries.getStorage(recoilStoreID, storeKey)?.read,
        atomInfo.isSet || options.syncDefault === true
          ? atomInfo.loadable
          : null,
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
    if (write != null && snapshot !== previousSnapshotRef.current) {
      previousSnapshotRef.current = snapshot;
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
            for (const [, {options}] of registration.effects) {
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

  const updateItems = useRecoilTransaction_UNSTABLE(
    ({set, reset}) =>
      (diff: ItemDiff) => {
        const atomRegistry = registries.getAtomRegistry(
          recoilStoreID,
          storeKey,
        );
        const readFromStorageRequired =
          read ??
          (itemKey =>
            RecoilLoadable.error(
              `Read functionality not provided for ${
                storeKey != null ? `"${storeKey}" ` : ''
              }store in useRecoilSync() hook while updating item "${itemKey}".`,
            ));
        const readFromDiff = itemKey =>
          diff.has(itemKey)
            ? diff.get(itemKey)
            : readFromStorageRequired(itemKey);
        // TODO iterating over all atoms registered with the store could be
        // optimized if we maintain a reverse look-up map of subscriptions.
        for (const [, registration] of atomRegistry) {
          // Iterate through the effects for this storage in reverse order as
          // the last effect takes priority.
          for (const [, {options, subscribedItemKeys}] of Array.from(
            registration.effects,
          ).reverse()) {
            // Only consider updating this atom if it subscribes to any items
            // specified in the diff.
            if (setIntersectsMap(subscribedItemKeys, diff)) {
              const loadable = options.read({read: readFromDiff});
              if (loadable != null) {
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
                // If this effect set the atom, don't bother with lower-priority
                // effects. But, if the item didn't have a value then reset
                // below but ontinue falling back on other effects for the same
                // storage.  This can happen if multiple effects are used to
                // migrate to a new itemKey and we want to read from the
                // older key as a fallback.
                break;
              } else {
                registration.pendingUpdate = {value: DEFAULT_VALUE};
                reset(registration.atom);
              }
            }
          }
        }
      },
    [recoilStoreID, storeKey, read],
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
        for (const [, {subscribedItemKeys}] of registration.effects) {
          for (const itemKey of subscribedItemKeys) {
            if (!itemSnapshot.has(itemKey)) {
              itemSnapshot.set(itemKey, null);
            }
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
  useEffect(
    () => registries.setStorage(recoilStoreID, storeKey, {write, read}),
    [recoilStoreID, storeKey, read, write],
  );
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
    // Get options with defaults
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

    if (trigger === 'get') {
      // Initialize Atom value
      const readFromStorage = storage?.read;
      if (readFromStorage != null) {
        try {
          const loadable = options.read({read: readFromStorage});
          if (loadable != null) {
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

    // Register Atom
    return registries.setAtomEffect(storeID, storeKey, node, options);
  };
}

module.exports = {
  useRecoilSync,
  RecoilSync,
  syncEffect,
  registries_FOR_TESTING: registries,
};
