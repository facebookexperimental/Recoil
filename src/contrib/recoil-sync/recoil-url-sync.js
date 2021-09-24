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

import type {AtomEffect} from '../../recoil_values/Recoil_atom';
import type {ItemKey, SyncEffectOptions, SyncKey} from './recoil-sync';

const {syncEffect, useRecoilSync} = require('./recoil-sync');
const React = require('react');

type NodeKey = string;
type AtomRegistration = {
  history: HistoryOption,
};

const registries: Map<SyncKey, Map<NodeKey, AtomRegistration>> = new Map();

function updateURL(loc: LocationOption, serialization): string {
  switch (loc.part) {
    case 'href':
      return serialization;
    case 'hash':
      return `#${serialization}`;
    case 'search': {
      const {queryParam} = loc;
      if (queryParam == null) {
        return `?${serialization}${location.hash}`;
      }
      const searchParams = new URLSearchParams(location.search);
      searchParams.set(queryParam, serialization);
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
};

function useRecoilURLSync({
  syncKey,
  location,
  serialize,
}: RecoilURLSyncOptions): void {
  function read() {}

  function write({items}) {
    // Only serialize atoms in a non-default value state.
    const state = new Map(
      Array.from(items.entries())
        .filter(([, loadable]) => loadable?.state === 'hasValue')
        .map(([key, loadable]) => [key, loadable?.contents]),
    );

    // TODO Support History Push vs Replace
    const newURL = updateURL(location, serialize(state));
    history.replaceState(null, '', newURL);
  }

  function listen() {}

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
