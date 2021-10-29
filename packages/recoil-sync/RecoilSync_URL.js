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

import type {AtomEffect, Loadable} from 'Recoil';
import type {ItemKey, SyncEffectOptions, SyncKey} from './RecoilSync';

const {RecoilLoadable} = require('Recoil');

const {syncEffect, useRecoilSync} = require('./RecoilSync');
const err = require('./util/RecoilSync_err');
const objectFromEntries = require('./util/RecoilSync_objectFromEntries');
const React = require('react');
const {useCallback, useEffect, useMemo, useRef} = require('react');
const {assertion, mixed, writableDict} = require('refine');

type NodeKey = string;
type ItemsState = {[ItemKey]: mixed};
type AtomRegistration = {
  history: HistoryOption,
  itemKeys: Set<ItemKey>,
};

const registries: Map<SyncKey, Map<NodeKey, AtomRegistration>> = new Map();

const refineState = assertion(writableDict(mixed()));

function parseURL(
  loc: LocationOption,
  deserialize: string => mixed,
): ?ItemsState {
  switch (loc.part) {
    case 'href':
      return refineState(
        deserialize(`${location.pathname}${location.search}${location.hash}`),
      );
    case 'hash':
      return location.hash
        ? refineState(deserialize(decodeURIComponent(location.hash.substr(1))))
        : null;
    case 'search':
      return location.search
        ? refineState(
            deserialize(decodeURIComponent(location.search.substr(1))),
          )
        : null;
    case 'queryParams': {
      const searchParams = new URLSearchParams(location.search);
      const {param} = loc;
      if (param != null) {
        const stateStr = searchParams.get(param);
        return stateStr != null ? refineState(deserialize(stateStr)) : null;
      }
      return objectFromEntries(
        Array.from(searchParams.entries()).map(([key, value]) => [
          key,
          deserialize(value),
        ]),
      );
    }
  }
  throw err(`Unknown URL location part: "${loc.part}"`);
}

function updateURL(
  loc: LocationOption,
  items: ItemsState,
  resetItemKey: Set<ItemKey>,
  serialize: mixed => string,
): string {
  switch (loc.part) {
    case 'href':
      return serialize(items);
    case 'hash':
      return `#${encodeURIComponent(serialize(items))}`;
    case 'search':
      return `?${encodeURIComponent(serialize(items))}${location.hash}`;
    case 'queryParams': {
      const {param} = loc;
      const searchParams = new URLSearchParams(location.search);
      if (param != null) {
        searchParams.set(param, serialize(items));
      } else {
        for (const itemKey of resetItemKey) {
          searchParams.delete(itemKey);
        }
        for (const [itemKey, value] of Object.entries(items)) {
          searchParams.set(itemKey, serialize(value));
        }
      }
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
  | {part: 'search'}
  | {part: 'queryParams', param?: string};
type RecoilURLSyncOptions = {
  syncKey?: SyncKey,
  location: LocationOption,
  serialize: mixed => string,
  deserialize: string => mixed,
};

function useRecoilURLSync({
  syncKey,
  location,
  serialize,
  deserialize,
}: RecoilURLSyncOptions): void {
  // Parse and cache the current state from the URL
  const parseCurrentState: LocationOption => ?ItemsState = useCallback(
    loc => parseURL(loc, deserialize),
    [deserialize],
  );
  const updateCachedState: LocationOption => void = useCallback(
    loc => {
      cachedState.current = parseCurrentState(loc);
    },
    [parseCurrentState],
  );
  const firstRender = useRef(true); // Avoid executing parseCurrentState() on each render
  const cachedState = useRef<?ItemsState>(
    firstRender.current ? parseCurrentState(location) : null,
  );
  firstRender.current = false;
  // Update cached URL parsing if properties of location prop change, but not
  // based on just the object reference itself.
  const myLocation = useMemo(
    () => location,
    // Complications with disjoint uniont
    // $FlowIssue[prop-missing]
    [location.part, location.queryParam], // eslint-disable-line fb-www/react-hooks-deps
  );
  useEffect(
    () => updateCachedState(myLocation),
    [myLocation, updateCachedState],
  );

  function write({diff, allItems}) {
    // Only serialize atoms in a non-default value state.
    const newState: ItemsState = objectFromEntries(
      Array.from(allItems.entries())
        .filter(([, loadable]) => loadable?.state === 'hasValue')
        .map(([key, loadable]) => [key, loadable?.contents]),
    );
    const resetKeys = new Set(
      Array.from(allItems.entries())
        .filter(([, loadable]) => loadable == null)
        .map(([key]) => key),
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

    const replaceState: ?ItemsState = cachedState.current;
    if (itemsToPush?.size && replaceState != null) {
      // First, repalce the URL with any atoms that replace the URL history
      for (const [key] of allItems) {
        if (!itemsToPush.has(key)) {
          key in newState
            ? (replaceState[key] = newState[key])
            : delete replaceState[key];
        }
      }
      const replacedResetKeys = new Set(
        Array.from(resetKeys).filter(key => !itemsToPush.has(key)),
      );
      const replaceURL = updateURL(
        location,
        replaceState,
        replacedResetKeys,
        serialize,
      );
      history.replaceState(null, '', replaceURL);

      // Next, push the URL with any atoms that caused a new URL history entry
      const pushURL = updateURL(location, newState, resetKeys, serialize);
      history.pushState(null, '', pushURL);
    } else {
      // Just replace the URL with the new state
      const newURL = updateURL(location, newState, resetKeys, serialize);
      history.replaceState(null, '', newURL);
    }
    cachedState.current = newState;
  }

  function read(itemKey): ?Loadable<mixed> {
    return cachedState.current && itemKey in cachedState.current
      ? RecoilLoadable.of(cachedState.current[itemKey])
      : null;
  }

  function listen({updateAllKnownItems}) {
    function handleUpdate() {
      updateCachedState(location);
      if (cachedState.current != null) {
        const mappedState = new Map(
          Array.from(Object.entries(cachedState.current)).map(([k, v]) => [
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
