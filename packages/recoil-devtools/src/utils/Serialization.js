/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow
 * @format
 */
'use strict';

const SerializedValueType = Object.freeze({
  null: '0',
  undefined: '1',
  set: '2',
  map: '3',
  object: '4',
  error: '5',
  array: '6',
  primitive: '7',
  function: '8',
  promise: '9',
  date: 'a',
  symbol: 'b',
});

export type SupportedSerializedValueTypes = $Values<typeof SerializedValueType>;

export type SerializedValue = {
  t: SupportedSerializedValueTypes,
  v?: any,
  e?: number,
};

const DefaultMaxDepth = 5;
const DefaultMaxItems = 1000;

/* Converts mixed values to a representation that can be serialized
 * by window.postMessage */
// TODO: Handle promises and immutable
function serialize(
  item: mixed,
  maxDepth: number = DefaultMaxDepth,
  maxItems: number = DefaultMaxItems,
  parents?: ?Set<mixed>,
  depth: number = 0,
): SerializedValue {
  if (parents == null) {
    parents = new Set();
  }

  if (depth > maxDepth) {
    return {t: SerializedValueType.primitive, v: '[Max Depth Reached]'};
  }
  if (item && typeof item === 'object') {
    if (parents.has(item)) {
      return {t: SerializedValueType.primitive, v: '[Circular Reference]'};
    }
    parents.add(item);
  }

  let serialized: ?SerializedValue = null;
  if (item === null) {
    serialized = {t: SerializedValueType.null};
  } else if (item === undefined) {
    serialized = {t: SerializedValueType.undefined};
  } else if (Array.isArray(item)) {
    const {iterable, exceeds} = getExceedingItems<mixed>(item, maxItems);
    serialized = maybeAddExceeds(
      {
        t: SerializedValueType.array,
        v: iterable.map(it =>
          serialize(it, maxDepth, maxItems, parents, depth + 1),
        ),
      },
      exceeds,
    );
  } else if (item instanceof Set) {
    const {iterable, exceeds} = getExceedingItems<mixed>(
      Array.from(item),
      maxItems,
    );
    serialized = maybeAddExceeds(
      {
        t: SerializedValueType.set,
        v: iterable.map(it =>
          serialize(it, maxDepth, maxItems, parents, depth + 1),
        ),
      },
      exceeds,
    );
  } else if (item instanceof Map) {
    const {iterable, exceeds} = getExceedingItems<[mixed, mixed]>(
      Array.from(item.entries()),
      maxItems,
    );
    serialized = maybeAddExceeds(
      {
        t: SerializedValueType.map,
        v: iterable.map(entry =>
          entry.map(it =>
            serialize(it, maxDepth, maxItems, parents, depth + 1),
          ),
        ),
      },
      exceeds,
    );
  } else if (item instanceof Promise || typeof item?.then === 'function') {
    serialized = {t: SerializedValueType.promise, v: 'Promise<Pending>'};
  } else if (item instanceof Error) {
    serialized = {
      t: SerializedValueType.error,
      v: capStringLength(item.toString(), 150),
    };
  } else if (item instanceof Date) {
    serialized = {t: SerializedValueType.date, v: item.getTime()};
  } else if (typeof item === 'symbol') {
    serialized = {
      t: SerializedValueType.symbol,
      v: item.description,
    };
  } else if (typeof item === 'function') {
    serialized = {
      t: SerializedValueType.function,
      v: capStringLength(String(item), 150),
    };
  } else if (typeof item === 'object') {
    const {iterable, exceeds} = getExceedingItems<[string, mixed]>(
      Object.entries(item),
      maxItems,
    );
    serialized = maybeAddExceeds(
      {
        t: SerializedValueType.object,
        v: iterable.map(entry =>
          entry.map(it =>
            serialize(it, maxDepth, maxItems, parents, depth + 1),
          ),
        ),
      },
      exceeds,
    );
  } else {
    serialized = {t: SerializedValueType.primitive, v: item};
  }

  if (item && typeof item === 'object') {
    parents.delete(item);
  }
  return serialized;
}

function maybeAddExceeds(
  value: SerializedValue,
  exceeds: number,
): SerializedValue {
  if (exceeds > 0) {
    value.e = exceeds;
  }
  return value;
}

function getExceedingItems<T>(
  items: $ReadOnlyArray<T>,
  maxItems: number,
): {exceeds: number, iterable: $ReadOnlyArray<T>} {
  if (items.length > maxItems) {
    return {
      iterable: items.slice(0, maxItems),
      exceeds: items.length - maxItems,
    };
  }
  return {iterable: items, exceeds: 0};
}

/*
 * Restores a value that was treated by `serialize` function
 */
// TODO: Handle promises and immutable
function deserialize(item: ?SerializedValue): mixed {
  if (item == null) {
    return null;
  }
  const {v: value, t: type} = item;
  if (type === SerializedValueType.null) {
    return null;
  } else if (type === SerializedValueType.undefined) {
    return undefined;
  } else if (type === SerializedValueType.set) {
    return new Set(value?.map(deserialize));
  } else if (type === SerializedValueType.map) {
    return new Map(value?.map(entry => entry.map(deserialize)));
  } else if (type === SerializedValueType.date) {
    return new Date(value ?? 0);
  } else if (type == SerializedValueType.function) {
    // function cannot be restored :(
    return value;
  } else if (type == SerializedValueType.error) {
    // Errors are shown as strings
    return value;
  } else if (type === SerializedValueType.symbol) {
    return Symbol(value);
  } else if (type === SerializedValueType.array) {
    return value?.map(deserialize);
  } else if (type === SerializedValueType.object) {
    return value?.reduce((prev, [key, val]) => {
      prev[deserialize(key)] = deserialize(val);
      return prev;
    }, {});
  } else if (type === SerializedValueType.function) {
    return String(item);
  } else {
    return value;
  }
}

function formatForDiff(item: ?SerializedValue): mixed {
  if (item == null) {
    return 'undefined';
  }
  const {v: value, t: type} = item;
  if (type === SerializedValueType.null) {
    return null;
  } else if (type === SerializedValueType.undefined) {
    return 'undefined';
  } else if (type === SerializedValueType.set) {
    return value?.map(formatForDiff);
  } else if (type === SerializedValueType.map) {
    return value?.reduce((prev, [key, val]) => {
      prev[formatForDiff(key)] = formatForDiff(val);
      return prev;
    }, {});
  } else if (type === SerializedValueType.date) {
    return new Date(value ?? 0);
  } else if (type == SerializedValueType.error) {
    // Errors are compared as strings
    return value;
  } else if (type == SerializedValueType.function) {
    // function cannot be restored :(
    return value;
  } else if (type === SerializedValueType.symbol) {
    return Symbol(value);
  } else if (type === SerializedValueType.array) {
    return value?.map(formatForDiff);
  } else if (type === SerializedValueType.object) {
    return value?.reduce((prev, [key, val]) => {
      prev[formatForDiff(key)] = formatForDiff(val);
      return prev;
    }, {});
  } else if (type === SerializedValueType.function) {
    return String(item);
  } else {
    return value;
  }
}

function capStringLength(str: string, newLength: number): string {
  if (str.length > 150) {
    return `${str.slice(0, newLength)} (...)`;
  }
  return str;
}

module.exports = {serialize, deserialize, formatForDiff, SerializedValueType};
