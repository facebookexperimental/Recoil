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

import type {
  ItemKey,
  ItemSnapshot,
  ReadItem,
  StoreKey,
  SyncEffectOptions,
} from './RecoilSync';
import type {AtomEffect} from 'Recoil';
import type {CheckerReturnType} from 'refine';

const {DefaultValue, RecoilLoadable} = require('Recoil');

const {syncEffect, useRecoilSync} = require('./RecoilSync');
const React = require('react');
const {useCallback, useEffect, useMemo, useRef} = require('react');
const err = require('recoil-shared/util/Recoil_err');
const {assertion, mixed, writableDict} = require('refine');

type NodeKey = string;
// $FlowFixMe[reference-before-declaration]
type ItemState = CheckerReturnType<typeof itemStateChecker>;
type AtomRegistration = {
  history: HistoryOption,
  itemKeys: Set<ItemKey>,
};

const registries: Map<StoreKey, Map<NodeKey, AtomRegistration>> = new Map();

const itemStateChecker = writableDict(mixed());
const refineState = assertion(itemStateChecker);
const wrapState = (x: mixed): ItemSnapshot => {
  return new Map(Array.from(Object.entries(refineState(x))));
};
const unwrapState = (state: ItemSnapshot): ItemState =>
  Object.fromEntries(
    Array.from(state.entries())
      // Only serialize atoms in a non-default value state.
      .filter(([, value]) => !(value instanceof DefaultValue)),
  );

function parseURL(
  href: string,
  loc: LocationOption,
  deserialize: string => mixed,
): ?ItemSnapshot {
  const url = new URL(href);
  switch (loc.part) {
    case 'href':
      return wrapState(deserialize(`${url.pathname}${url.search}${url.hash}`));
    case 'hash':
      return url.hash
        ? wrapState(deserialize(decodeURIComponent(url.hash.substring(1))))
        : null;
    case 'search':
      return url.search
        ? wrapState(deserialize(decodeURIComponent(url.search.substring(1))))
        : null;
    case 'queryParams': {
      const searchParams = new URLSearchParams(url.search);
      const {param} = loc;
      if (param != null) {
        const stateStr = searchParams.get(param);
        return stateStr != null ? wrapState(deserialize(stateStr)) : new Map();
      }
      return new Map(
        Array.from(searchParams.entries()).map(([key, value]) => {
          try {
            return [key, deserialize(value)];
          } catch (error) {
            return [key, RecoilLoadable.error(error)];
          }
        }),
      );
    }
  }
  throw err(`Unknown URL location part: "${loc.part}"`);
}

function encodeURL(
  href: string,
  loc: LocationOption,
  items: ItemSnapshot,
  serialize: mixed => string,
): string {
  const url = new URL(href);
  switch (loc.part) {
    case 'href':
      return serialize(unwrapState(items));
    case 'hash':
      url.hash = encodeURIComponent(serialize(unwrapState(items)));
      break;
    case 'search':
      url.search = encodeURIComponent(serialize(unwrapState(items)));
      break;
    case 'queryParams': {
      const {param} = loc;
      const searchParams = new URLSearchParams(url.search);
      if (param != null) {
        searchParams.set(param, serialize(unwrapState(items)));
      } else {
        for (const [itemKey, value] of items.entries()) {
          value instanceof DefaultValue
            ? searchParams.delete(itemKey)
            : searchParams.set(itemKey, serialize(value));
        }
      }
      url.search = searchParams.toString();
      break;
    }
    default:
      throw err(`Unknown URL location part: "${loc.part}"`);
  }
  return url.href;
}

///////////////////////
// useRecoilURLSync()
///////////////////////
export type LocationOption =
  | {part: 'href'}
  | {part: 'hash'}
  | {part: 'search'}
  | {part: 'queryParams', param?: string};
export type BrowserInterface = {
  replaceURL?: string => void,
  pushURL?: string => void,
  getURL?: () => string,
  listenChangeURL?: (handler: () => void) => () => void,
};
export type RecoilURLSyncOptions = {
  children: React.Node,
  storeKey?: StoreKey,
  location: LocationOption,
  serialize: mixed => string,
  deserialize: string => mixed,
  browserInterface?: BrowserInterface,
};

const DEFAULT_BROWSER_INTERFACE = {
  replaceURL: (url: string) => history.replaceState(null, '', url),
  pushURL: (url: string) => history.pushState(null, '', url),
  getURL: () => window.document.location,
  listenChangeURL: (handleUpdate: () => void) => {
    window.addEventListener('popstate', handleUpdate);
    return () => window.removeEventListener('popstate', handleUpdate);
  },
};

function RecoilURLSync({
  storeKey,
  location: loc,
  serialize,
  deserialize,
  browserInterface,
  children,
}: RecoilURLSyncOptions): React.Node {
  const {getURL, replaceURL, pushURL, listenChangeURL} = {
    ...DEFAULT_BROWSER_INTERFACE,
    ...(browserInterface ?? {}),
  };

  // Parse and cache the current state from the URL
  // Update cached URL parsing if properties of location prop change, but not
  // based on just the object reference itself.
  const memoizedLoc = useMemo(
    () => loc,
    // Complications with disjoint uniont
    // $FlowIssue[prop-missing]
    [loc.part, loc.queryParam], // eslint-disable-line fb-www/react-hooks-deps
  );
  const updateCachedState: () => void = useCallback(() => {
    cachedState.current = parseURL(getURL(), memoizedLoc, deserialize);
  }, [getURL, memoizedLoc, deserialize]);
  const cachedState = useRef<?ItemSnapshot>(null);
  // Avoid executing updateCachedState() on each render
  const firstRender = useRef(true);
  firstRender.current && updateCachedState();
  firstRender.current = false;
  useEffect(updateCachedState, [updateCachedState]);

  const write = useCallback(
    ({diff, allItems}) => {
      updateCachedState(); // Just to be safe...

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
        const replaceItems: ItemSnapshot = cachedState.current;
        // First, repalce the URL with any atoms that replace the URL history
        for (const [key, value] of allItems) {
          if (!itemsToPush.has(key)) {
            replaceItems.set(key, value);
          }
        }
        replaceURL(encodeURL(getURL(), loc, replaceItems, serialize));

        // Next, push the URL with any atoms that caused a new URL history entry
        pushURL(encodeURL(getURL(), loc, allItems, serialize));
      } else {
        // Just replace the URL with the new state
        replaceURL(encodeURL(getURL(), loc, allItems, serialize));
      }
      cachedState.current = allItems;
    },
    [getURL, loc, pushURL, replaceURL, serialize, storeKey, updateCachedState],
  );

  const read: ReadItem = useCallback(itemKey => {
    return cachedState.current?.has(itemKey)
      ? cachedState.current?.get(itemKey)
      : new DefaultValue();
  }, []);

  const listen = useCallback(
    ({updateAllKnownItems}) => {
      function handleUpdate() {
        updateCachedState();
        if (cachedState.current != null) {
          updateAllKnownItems(cachedState.current);
        }
      }
      return listenChangeURL(handleUpdate);
    },
    [listenChangeURL, updateCachedState],
  );

  useRecoilSync({storeKey, read, write, listen});

  return children;
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
  RecoilURLSync,
  urlSyncEffect,
};
