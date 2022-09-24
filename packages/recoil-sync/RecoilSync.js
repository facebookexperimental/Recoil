/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

import type {AtomEffect, Loadable, RecoilState, StoreID} from 'Recoil';
import type {RecoilValueInfo} from 'Recoil_FunctionalCore';
import type {RecoilValue} from 'Recoil_RecoilValue';
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
const lazyProxy = require('recoil-shared/util/Recoil_lazyProxy');

type NodeKey = string;
export type ItemKey = string;
export type StoreKey = string | void;
type EffectKey = number;

// $FlowIssue[unclear-type]
export type ItemDiff = Map<ItemKey, DefaultValue | any>;
export type ItemSnapshot = Map<ItemKey, DefaultValue | mixed>;
export type WriteInterface = {
  diff: ItemDiff,
  allItems: ItemSnapshot,
};
export type WriteItem = <T>(ItemKey, DefaultValue | T) => void;
export type WriteItems = WriteInterface => void;
export type ResetItem = ItemKey => void;

export type ReadItem = ItemKey =>
  | DefaultValue
  | Promise<DefaultValue | mixed>
  | Loadable<DefaultValue | mixed>
  | mixed;

export type UpdateItem = <T>(ItemKey, DefaultValue | T) => void;
export type UpdateItems = ItemSnapshot => void;
export type UpdateAllKnownItems = ItemSnapshot => void;
export type ListenInterface = {
  updateItem: UpdateItem,
  updateItems: UpdateItems,
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
  input:
    | DefaultValue
    | Promise<mixed | DefaultValue>
    | Loadable<mixed | DefaultValue>
    | mixed,
  {refine, actionOnFailure_UNSTABLE}: AtomSyncOptions<T>,
): Loadable<T | DefaultValue> {
  return RecoilLoadable.of(input).map<T | DefaultValue>(x => {
    if (x instanceof DefaultValue) {
      return x;
    }
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
  const read: ReadItem = itemKey => {
    effectRegistration.subscribedItemKeys.add(itemKey);
    const value = diff?.has(itemKey)
      ? diff?.get(itemKey)
      : readFromStorageRequired(itemKey);

    if (RecoilLoadable.isLoadable(value)) {
      // $FlowIssue[incompatible-type]
      const loadable: Loadable<mixed> = value;
      if (loadable.state === 'hasError') {
        throw loadable.contents;
      }
    }
    return value;
  };

  let value;
  try {
    value = options.read({read});
  } catch (error) {
    return RecoilLoadable.error(error);
  }
  return value instanceof DefaultValue
    ? null
    : validateLoadable(value, options);
}

function writeAtomItemsToDiff<T>(
  diff: ItemDiff,
  options: AtomSyncOptions<T>,
  readFromStorage?: ReadItem,
  loadable: ?Loadable<T>,
): ItemDiff {
  if (loadable != null && loadable?.state !== 'hasValue') {
    return diff;
  }
  const readFromStorageRequired =
    readFromStorage ??
    (_ => {
      throw err(
        `Read functionality not provided for ${
          options.storeKey != null ? `"${options.storeKey}" ` : ''
        }store in useRecoilSync() hook while writing item "${
          options.itemKey
        }".`,
      );
    });
  const read = (itemKey: ItemKey) =>
    diff.has(itemKey) ? diff.get(itemKey) : readFromStorageRequired(itemKey);
  const write = <S>(k: ItemKey, l: DefaultValue | S) => void diff.set(k, l);
  const reset = (k: ItemKey) => void diff.set(k, DEFAULT_VALUE);

  options.write(
    {write, reset, read},
    loadable == null ? DEFAULT_VALUE : loadable.contents,
  );
  return diff;
}

const itemsFromSnapshot = (
  recoilStoreID: StoreID,
  storeKey: StoreKey,
  getInfo:
    | (<T>(RecoilValue<T>) => RecoilValueInfo<T>)
    | (<S>(RecoilValue<S>) => RecoilValueInfo<S>),
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
  getInfo:
    | (<T>(RecoilValue<T>) => RecoilValueInfo<T>)
    | (<S>(RecoilValue<S>) => RecoilValueInfo<S>),
): WriteInterface {
  // Use a Proxy so we only generate `allItems` if it's actually used.
  return lazyProxy(
    {diff},
    {allItems: () => itemsFromSnapshot(recoilStoreID, storeKey, getInfo)},
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
            if (setIntersectsMap(subscribedItemKeys, diff)) {
              const loadable = readAtomItems(effectRegistration, read, diff);
              if (loadable != null) {
                switch (loadable.state) {
                  case 'hasValue':
                    if (loadable.contents instanceof DefaultValue) {
                      atomRegistration.pendingUpdate = {value: DEFAULT_VALUE};
                      reset(atomRegistration.atom);
                    } else {
                      atomRegistration.pendingUpdate = {
                        value: loadable.contents,
                      };
                      set(atomRegistration.atom, loadable.contents);
                    }
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
    <T>(itemKey: ItemKey, newValue: DefaultValue | T) => {
      updateItems(new Map([[itemKey, newValue]]));
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
              itemSnapshot.set(itemKey, DEFAULT_VALUE);
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
      listen?.({updateItem, updateItems, updateAllKnownItems}),
    [updateItem, updateItems, updateAllKnownItems, listen],
  );

  // Register Storage
  // Save before effects so that we can initialize atoms for initial render
  registries.setStorage(recoilStoreID, storeKey, {write, read});
  useEffect(
    () => registries.setStorage(recoilStoreID, storeKey, {write, read}),
    [recoilStoreID, storeKey, read, write],
  );
}

function RecoilSync({
  children,
  ...props
}: {
  ...RecoilSyncOptions,
  children: React.Node,
}): React.Node {
  useRecoilSync(props);
  return children;
}

///////////////////////
// syncEffect()
///////////////////////
export type ReadAtomInterface = {read: ReadItem};
export type ReadAtom = ReadAtomInterface =>
  | DefaultValue
  | Promise<DefaultValue | mixed>
  | Loadable<DefaultValue | mixed>
  | mixed;
export type WriteAtomInterface = {
  write: WriteItem,
  reset: ResetItem,
  read: ReadItem,
};
export type WriteAtom<T> = (WriteAtomInterface, DefaultValue | T) => void;

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
        window.setTimeout(() => {
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
        }, 0);
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
