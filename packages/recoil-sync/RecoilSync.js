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

function hasIntersection<U, V>(a: Set<U>, b: Map<U, V>): boolean {
  for (const x of a) {
    if (b.has(x)) {
      return true;
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
  ): {effectRegistration: EffectRegistration<T>, unregisterEffect: () => void} {
    const atomRegistry = this.getAtomRegistry(recoilStoreID, externalStoreKey);
    if (!atomRegistry.has(node.key)) {
      atomRegistry.set(node.key, {atom: node, effects: new Map()});
    }
    const effectKey = this.nextEffectKey++;
    const effectRegistration = {
      options,
      subscribedItemKeys: new Set([options.itemKey]),
    };
    atomRegistry.get(node.key)?.effects.set(effectKey, effectRegistration);
    return {
      effectRegistration,
      unregisterEffect: () =>
        void atomRegistry.get(node.key)?.effects.delete(effectKey),
    };
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

function readAtomItems<T>(
  effectRegistration: EffectRegistration<T>,
  readFromStorage?: ReadItem,
  diff?: ItemDiff,
): ?Loadable<T | DefaultValue> {
  const {options} = effectRegistration;
  const readFromStorageRequired =
    readFromStorage ??
    (itemKey =>
      RecoilLoadable.error(
        `Read functionality not provided for ${
          options.storeKey != null ? `"${options.storeKey}" ` : ''
        }store in useRecoilSync() hook while updating item "${itemKey}".`,
      ));

  effectRegistration.subscribedItemKeys = new Set();
  const read = itemKey => {
    effectRegistration.subscribedItemKeys.add(itemKey);
    return diff != null && diff.has(itemKey)
      ? diff.get(itemKey)
      : readFromStorageRequired(itemKey);
  };

  const loadable = options.read({read});
  return loadable && validateLoadable(loadable, options);
}

function writeAtomItemsToDiff<T>(
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
      writeAtomItemsToDiff(
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

function getWriteInterface(
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
            for (const [, {options}] of registration.effects) {
              writeAtomItemsToDiff(
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
          getWriteInterface(
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
        // TODO iterating over all atoms registered with the store could be
        // optimized if we maintain a reverse look-up map of subscriptions.
        for (const [, atomRegistration] of atomRegistry) {
          // Iterate through the effects for this storage in reverse order as
          // the last effect takes priority.
          for (const [, effectRegistration] of Array.from(
            atomRegistration.effects,
          ).reverse()) {
            const {options, subscribedItemKeys} = effectRegistration;
            // Only consider updating this atom if it subscribes to any items
            // specified in the diff.
            if (hasIntersection(subscribedItemKeys, diff)) {
              const loadable = readAtomItems(effectRegistration, read, diff);
              if (loadable != null) {
                switch (loadable.state) {
                  case 'hasValue':
                    atomRegistration.pendingUpdate = {
                      value: loadable.contents,
                    };
                    set(atomRegistration.atom, loadable.contents);
                    break;
                  case 'hasError':
                    if (options.actionOnFailure_UNSTABLE === 'errorState') {
                      // TODO Async atom support to allow setting atom to error state
                      // in the meantime we can just reset it to default value...
                      atomRegistration.pendingUpdate = {value: DEFAULT_VALUE};
                      reset(atomRegistration.atom);
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
                atomRegistration.pendingUpdate = {value: DEFAULT_VALUE};
                reset(atomRegistration.atom);
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

    // Register Atom
    const {effectRegistration, unregisterEffect} = registries.setAtomEffect(
      storeID,
      storeKey,
      node,
      options,
    );

    if (trigger === 'get') {
      // Initialize Atom value
      const readFromStorage = storage?.read;
      if (readFromStorage != null) {
        try {
          const loadable = readAtomItems(effectRegistration, readFromStorage);
          if (loadable != null) {
            switch (loadable.state) {
              case 'hasValue':
                if (!(loadable.contents instanceof DefaultValue)) {
                  setSelf(loadable.contents);
                }
                break;
              case 'hasError':
                if (options.actionOnFailure_UNSTABLE === 'errorState') {
                  throw loadable.contents;
                }
                break;
              case 'loading':
                setSelf(loadable.toPromise());
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
            const diff = writeAtomItemsToDiff(
              new Map(),
              options,
              storage?.read,
              loadable,
            );
            writeToStorage(
              getWriteInterface(storeID, storeKey, diff, getInfo_UNSTABLE),
            );
          }
        });
      }
    }

    // Cleanup atom effect registration
    return unregisterEffect;
  };
}

module.exports = {
  useRecoilSync,
  RecoilSync,
  syncEffect,
  registries_FOR_TESTING: registries,
};
