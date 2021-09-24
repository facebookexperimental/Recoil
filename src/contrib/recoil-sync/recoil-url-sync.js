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
// TODO PUBLIC LOADABLE INTERFACE

import type {Loadable} from '../../adt/Recoil_Loadable';
import type {AtomEffect} from '../../recoil_values/Recoil_atom';
import type {ItemKey, SyncEffectOptions, SyncKey} from './recoil-sync';

const {loadableWithValue} = require('../../adt/Recoil_Loadable');
const {syncEffect, useRecoilSync} = require('./recoil-sync');
const React = require('react');

type NodeKey = string;
type AtomRegistration = {
  history: HistoryOption,
};

const registries: Map<SyncKey, Map<NodeKey, AtomRegistration>> = new Map();

function parseURL(loc: LocationOption): ?string {
  switch (loc.part) {
    case 'href':
      return `${location.pathname}${location.search}${location.hash}`;
    case 'hash':
      return location.hash ? decodeURIComponent(location.hash.substr(1)) : null;
    case 'search': {
      const {queryParam} = loc;
      if (queryParam == null) {
        return location.search
          ? decodeURIComponent(location.search.substr(1))
          : null;
      }
      const param = new URLSearchParams(location.search).get(queryParam);
      return param != null ? decodeURIComponent(param) : null;
    }
  }
  throw new Error(`Unknown URL location part: "${loc.part}"`);
}

function updateURL(loc: LocationOption, serialization): string {
  switch (loc.part) {
    case 'href':
      return serialization;
    case 'hash':
      return `#${encodeURIComponent(serialization)}`;
    case 'search': {
      const {queryParam} = loc;
      if (queryParam == null) {
        return `?${encodeURIComponent(serialization)}${location.hash}`;
      }
      const searchParams = new URLSearchParams(location.search);
      searchParams.set(queryParam, encodeURIComponent(serialization));
      return `?${searchParams.toString()}${location.hash}`;
    }
  }
  throw new Error(`Unknown URL location part: "${loc.part}"`);
}

///////////////////////
// useRecoilURLSync()
///////////////////////
export type LocationOption =
  | {part: 'href'}
  | {part: 'hash'}
  | {part: 'search', queryParam?: string};
export type ItemState = Map<ItemKey, mixed>;
type RecoilURLSyncOptions = {
  syncKey?: SyncKey,
  location: LocationOption,
  serialize: ItemState => string,
  deserialize: string => ItemState,
};

function useRecoilURLSync({
  syncKey,
  location,
  serialize,
  deserialize,
}: RecoilURLSyncOptions): void {
  function write({allItems}) {
    // Only serialize atoms in a non-default value state.
    const state = new Map(
      Array.from(allItems.entries())
        .filter(([, loadable]) => loadable?.state === 'hasValue')
        .map(([key, loadable]) => [key, loadable?.contents]),
    );

    // TODO Support History Push vs Replace
    const newURL = updateURL(location, serialize(state));
    history.replaceState(null, '', newURL);
  }

  function read(itemKey): ?Loadable<mixed> {
    const stateStr = parseURL(location);
    if (stateStr != null) {
      // TODO cache deserialization
      const state = deserialize(stateStr);
      return state.has(itemKey) ? loadableWithValue(state.get(itemKey)) : null;
    }
  }

  function listen({updateAllKnownItems}) {
    function handleUpdate() {
      const stateStr = parseURL(location);
      if (stateStr != null) {
        const state = deserialize(stateStr);
        const mappedState = new Map(
          Array.from(state.entries()).map(([k, v]) => [
            k,
            loadableWithValue(v),
          ]),
        );
        updateAllKnownItems(mappedState);
      }
    }
    window.addEventListener('popstate', handleUpdate);
    return () => window.removeEventListener('popstate', handleUpdate);
  }

  useRecoilSync({syncKey, read, write, listen});
}

function RecoilURLSync(props: RecoilURLSyncOptions): React.Node {
  useRecoilURLSync(props);
  return null;
}

///////////////////////
// urlSyncEffect()
///////////////////////
type HistoryOption = 'push' | 'replace';

function urlSyncEffect<T>({
  history = 'replace',
  ...options
}: {
  ...SyncEffectOptions<T>,
  history?: HistoryOption,
}): AtomEffect<T> {
  const atomEffect = syncEffect<T>(options);
  return effectArgs => {
    // Register URL sync options
    if (!registries.has(options.syncKey)) {
      registries.set(options.syncKey, new Map());
    }
    const atomRegistry = registries.get(options.syncKey);
    if (atomRegistry == null) {
      throw new Error('Error with atom registration');
    }
    atomRegistry.set(effectArgs.node.key, {history});

    // Wrap syncEffect() atom effect
    const cleanup = atomEffect(effectArgs);

    // Cleanup atom option registration
    return () => {
      atomRegistry.delete(effectArgs.node.key);
      cleanup?.();
    };
  };
}

module.exports = {
  useRecoilURLSync,
  RecoilURLSync,
  urlSyncEffect,
};
