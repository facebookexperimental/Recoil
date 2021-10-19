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
import type {AtomEffect} from '../../recoil_values/Recoil_atom';
import type {ItemKey, SyncEffectOptions, SyncKey} from './recoil-sync';

const {RecoilLoadable} = require('../../adt/Recoil_Loadable');
const err = require('../../util/Recoil_err');
const {syncEffect, useRecoilSync} = require('./recoil-sync');
const React = require('react');
const {useCallback, useEffect, useRef} = require('react');

type NodeKey = string;
type AtomRegistration = {
  history: HistoryOption,
  itemKeys: Set<ItemKey>,
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
  throw err(`Unknown URL location part: "${loc.part}"`);
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
  throw err(`Unknown URL location part: "${loc.part}"`);
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
  // Parse and cache the current state from the URL
  const parseCurrentState = useCallback(
    (loc: LocationOption) => {
      const stateStr = parseURL(loc);
      return stateStr != null ? deserialize(stateStr) : null;
    },
    [deserialize],
  );
  const updateCachedState = useCallback(
    (loc: LocationOption) => {
      cachedState.current = parseCurrentState(loc);
    },
    [parseCurrentState],
  );
  const firstRender = useRef(true); // Avoid executing parseCurrentState() on each render
  const cachedState = useRef<?ItemState>(
    firstRender.current ? parseCurrentState(location) : null,
  );
  firstRender.current = false;
  // Update cached URL parsing if properties of location prop change, but not
  // based on just the object reference itself.
  // eslint-disable-next-line fb-www/react-hooks-deps
  useEffect(
    () => updateCachedState(location),
    [
      location.part,
      // $FlowFixMe[prop-missing] Complications with disjoint unions...
      location.queryParam,
      updateCachedState,
    ],
  );

  function write({diff, allItems}) {
    // Only serialize atoms in a non-default value state.
    const newState = new Map(
      Array.from(allItems.entries())
        .filter(([, loadable]) => loadable?.state === 'hasValue')
        .map(([key, loadable]) => [key, loadable?.contents]),
    );
    updateCachedState(location);

    // This could be optimized with an itemKey-based registery if necessary to avoid
    // atom traversal.
    const atomRegistry = registries.get(syncKey);
    const itemsToPush =
      atomRegistry != null
        ? new Set(
            Array.from(atomRegistry)
              .filter(
                ([, {history, itemKeys}]) =>
                  history === 'push' &&
                  Array.from(itemKeys).some(key => diff.has(key)),
              )
              .map(([, {itemKeys}]) => itemKeys)
              .reduce(
                (itemKeys, keys) => itemKeys.concat(Array.from(keys)),
                [],
              ),
          )
        : null;

    const replaceState = cachedState.current;
    if (itemsToPush?.size && replaceState != null) {
      // First, repalce the URL with any atoms that replace the URL history
      for (const [key] of allItems) {
        if (!itemsToPush.has(key)) {
          newState.has(key)
            ? replaceState.set(key, newState.get(key))
            : replaceState.delete(key);
        }
      }
      const replaceURL = updateURL(location, serialize(replaceState));
      history.replaceState(null, '', replaceURL);

      // Next, push the URL with any atoms that caused a new URL history entry
      const pushURL = updateURL(location, serialize(newState));
      history.pushState(null, '', pushURL);
    } else {
      // Just replace the URL with the new state
      const newURL = updateURL(location, serialize(newState));
      history.replaceState(null, '', newURL);
    }
    cachedState.current = newState;
  }

  function read(itemKey): ?Loadable<mixed> {
    return cachedState.current?.has(itemKey)
      ? RecoilLoadable.of(cachedState.current?.get(itemKey))
      : null;
  }

  function listen({updateAllKnownItems}) {
    function handleUpdate() {
      updateCachedState(location);
      if (cachedState.current != null) {
        const mappedState = new Map(
          Array.from(cachedState.current.entries()).map(([k, v]) => [
            k,
            RecoilLoadable.of(v),
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
      throw err('Error with atom registration');
    }
    atomRegistry.set(effectArgs.node.key, {
      history,
      itemKeys: new Set([options.key ?? effectArgs.node.key]),
    });

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
