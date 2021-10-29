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
import type {
  ItemKey,
  ItemSnapshot,
  StoreKey,
  SyncEffectOptions,
} from './RecoilSync';
import type {Get} from 'refine';

const {RecoilLoadable} = require('Recoil');

const {syncEffect, useRecoilSync} = require('./RecoilSync');
const err = require('./util/RecoilSync_err');
const objectFromEntries = require('./util/RecoilSync_objectFromEntries');
const React = require('react');
const {useCallback, useEffect, useMemo, useRef} = require('react');
const {assertion, mixed, writableDict} = require('refine');

type NodeKey = string;
type ItemState = Get<typeof itemStateChecker>;
type AtomRegistration = {
  history: HistoryOption,
  itemKeys: Set<ItemKey>,
};

const registries: Map<StoreKey, Map<NodeKey, AtomRegistration>> = new Map();

const itemStateChecker = writableDict(mixed());
const refineState = assertion(itemStateChecker);
const wrapState = (x: mixed): ItemSnapshot => {
  const refinedState = refineState(x);
  return new Map(
    Array.from(Object.entries(refinedState)).map(([key, value]) => [
      key,
      RecoilLoadable.of(value),
    ]),
  );
};
const unwrapState = (state: ItemSnapshot): ItemState =>
  objectFromEntries(
    Array.from(state.entries())
      // Only serialize atoms in a non-default value state.
      .filter(([, loadable]) => loadable?.state === 'hasValue')
      .map(([key, loadable]) => [key, loadable?.contents]),
  );

function parseURL(
  loc: LocationOption,
  deserialize: string => mixed,
): ?ItemSnapshot {
  switch (loc.part) {
    case 'href':
      return wrapState(
        deserialize(`${location.pathname}${location.search}${location.hash}`),
      );
    case 'hash':
      return location.hash
        ? wrapState(deserialize(decodeURIComponent(location.hash.substr(1))))
        : null;
    case 'search':
      return location.search
        ? wrapState(deserialize(decodeURIComponent(location.search.substr(1))))
        : null;
    case 'queryParams': {
      const searchParams = new URLSearchParams(location.search);
      const {param} = loc;
      if (param != null) {
        const stateStr = searchParams.get(param);
        return stateStr != null ? wrapState(deserialize(stateStr)) : null;
      }
      return new Map(
        Array.from(searchParams.entries()).map(([key, value]) => {
          try {
            return [key, RecoilLoadable.of(deserialize(value))];
          } catch (error) {
            return [key, RecoilLoadable.error(error)];
          }
        }),
      );
    }
  }
  throw err(`Unknown URL location part: "${loc.part}"`);
}

function updateURL(
  loc: LocationOption,
  items: ItemSnapshot,
  serialize: mixed => string,
): string {
  switch (loc.part) {
    case 'href':
      return serialize(unwrapState(items));
    case 'hash':
      return `#${encodeURIComponent(serialize(unwrapState(items)))}`;
    case 'search':
      return `?${encodeURIComponent(serialize(unwrapState(items)))}${
        location.hash
      }`;
    case 'queryParams': {
      const {param} = loc;
      const searchParams = new URLSearchParams(location.search);
      if (param != null) {
        searchParams.set(param, serialize(unwrapState(items)));
      } else {
        for (const [itemKey, loadable] of items.entries()) {
          loadable != null
            ? searchParams.set(itemKey, serialize(loadable.contents))
            : searchParams.delete(itemKey);
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
export type RecoilURLSyncOptions = {
  storeKey?: StoreKey,
  location: LocationOption,
  serialize: mixed => string,
  deserialize: string => mixed,
};

function useRecoilURLSync({
  storeKey,
  location,
  serialize,
  deserialize,
}: RecoilURLSyncOptions): void {
  // Parse and cache the current state from the URL
  const parseCurrentState: LocationOption => ?ItemSnapshot = useCallback(
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
  const cachedState = useRef<?ItemSnapshot>(
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
    updateCachedState(location);

    // This could be optimized with an itemKey-based registery if necessary to avoid
    // atom traversal.
    const atomRegistry = registries.get(storeKey);
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

    if (itemsToPush?.size && cachedState.current != null) {
      const replaceState: ItemSnapshot = cachedState.current;
      // First, repalce the URL with any atoms that replace the URL history
      for (const [key, loadable] of allItems) {
        if (!itemsToPush.has(key)) {
          replaceState.set(key, loadable);
        }
      }
      const replaceURL = updateURL(location, replaceState, serialize);
      history.replaceState(null, '', replaceURL);

      // Next, push the URL with any atoms that caused a new URL history entry
      const pushURL = updateURL(location, allItems, serialize);
      history.pushState(null, '', pushURL);
    } else {
      // Just replace the URL with the new state
      const newURL = updateURL(location, allItems, serialize);
      history.replaceState(null, '', newURL);
    }
    cachedState.current = allItems;
  }

  function read(itemKey): ?Loadable<mixed> {
    return cachedState.current?.get(itemKey);
  }

  function listen({updateAllKnownItems}) {
    function handleUpdate() {
      updateCachedState(location);
      if (cachedState.current != null) {
        updateAllKnownItems(cachedState.current);
      }
    }
    window.addEventListener('popstate', handleUpdate);
    return () => window.removeEventListener('popstate', handleUpdate);
  }

  useRecoilSync({storeKey, read, write, listen});
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
    if (!registries.has(options.storeKey)) {
      registries.set(options.storeKey, new Map());
    }
    const atomRegistry = registries.get(options.storeKey);
    if (atomRegistry == null) {
      throw err('Error with atom registration');
    }
    atomRegistry.set(effectArgs.node.key, {
      history,
      itemKeys: new Set([options.itemKey ?? effectArgs.node.key]),
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
