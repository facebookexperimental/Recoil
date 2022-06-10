// Minimum TypeScript Version: 3.9

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 */

 import {
  DefaultValue,
  RecoilLoadable,
  AtomEffect,
} from 'recoil';
import {
  // Keys
  ItemKey,
  StoreKey,

  // Core Recoil Sync
  RecoilSync,
  syncEffect,

  // Recoil Sync URL
  RecoilURLSync,
  RecoilURLSyncJSON,
  RecoilURLSyncTransit,
  urlSyncEffect,
} from 'recoil-sync';
import {
  string,
  number,
} from 'refine';

// Keys
const itemKey: ItemKey = 'str';
const storeKey: StoreKey = 'str';

const DEFAULT_VALUE = new DefaultValue();

// <RecoilSync>
RecoilSync(); // $ExpectError
RecoilSync({children: null, bad: 'BAD'}); // $ExpectError
RecoilSync({children: null, storeKey});
RecoilSync({children: null, storeKey: 0}); // $ExpectError
RecoilSync({children: null, read: (x: ItemKey) => undefined});
RecoilSync({children: null, read: (x: ItemKey) => 'any'});
RecoilSync({children: null, read: (x: ItemKey) => DEFAULT_VALUE});
RecoilSync({children: null, read: (x: ItemKey) => Promise.resolve('any')});
RecoilSync({children: null, read: (x: ItemKey) => RecoilLoadable.of('any')});
RecoilSync({children: null, read: (x: number) => 'BAD'}); // $ExpectError
RecoilSync({children: null, write: ({diff, allItems}) => {
  const diffMap: Map<ItemKey, unknown> = diff;
  const allItemsMap: Map<ItemKey, unknown> = allItems;
  const bad1: Map<ItemKey, string> = allItems; // $ExpectError
  const bad2: string = allItems; // $ExpectError
}});
RecoilSync({children: null, write: ({bad}) => {}}); // $ExpectError
RecoilSync({children: null, listen: ({updateItem, updateAllKnownItems}) => {
  updateItem(); // $ExpectError
  updateItem(0); // $ExpectError
  updateItem(itemKey); // $ExpectError
  updateItem(itemKey, 0); // $ExpectType void

  updateAllKnownItems(); // $ExpectError
  updateAllKnownItems(0); // $ExpectError
  updateAllKnownItems(new Map()); // $ExpectType void
}});

// syncEffect()
syncEffect(); // $ExpectError
syncEffect({refine: string()}); // $ExpectType AtomEffect<string>
syncEffect({refine: number()}); // $ExpectType AtomEffect<number>
syncEffect({refine: number()}); // $ExpectType AtomEffect<number>
syncEffect({ // $ExpectType AtomEffect<number>
  itemKey,
  storeKey,
  refine: number(),
  syncDefault: true,
});
syncEffect({ // $ExpectType AtomEffect<number>
  refine: number(),
  read: ({read}) => {
    read(); // $ExpectError
    read(0); // $ExpectError
    read(itemKey); // $ExpectType unknown
  },
  write: ({read, write, reset}) => {
    read(); // $ExpectError
    read(0); // $ExpectError
    read(itemKey); // $ExpectType unknown

    reset(); // $ExpectError
    reset(0); // $ExpectError
    reset(itemKey); // $ExpectType void

    write(); // $ExpectError
    write(0); // $ExpectError
    write(itemKey); // $ExpectError
    write(itemKey, 'any'); // $ExpectType void
  },
});

// <RecoilURLSync>
RecoilURLSync(); // $ExpectError
RecoilURLSync({
  children: null,
  storeKey,
  location: {part: 'queryParams'},
  serialize: String,
  deserialize: (x: string) => x,
  browserInterface: {
    replaceURL: (url: string) => {},
    pushURL: (url: string) => {},
    getURL: () => 'url',
    listenChangeURL: (handler) => {
      handler(); // $ExpectType void
      return () => {};
    },
  }
});

// urlSyncEffect()
urlSyncEffect({ // $ExpectType AtomEffect<number>
  itemKey,
  storeKey,
  refine: number(),
  history: 'push',
});

// <RecoilURLSyncJSON>
RecoilURLSyncJSON(); // $ExpectError
RecoilURLSyncJSON({
  children: null,
  storeKey,
  location: {part: 'queryParams'},
  serialize: String, // $ExpectError
  deserialize: (x: string) => x,
});
RecoilURLSyncJSON({
  children: null,
  storeKey,
  location: {part: 'queryParams'},
});

// <RecoilURLSyncTransit>
class MyClass {
  prop: number;
}
RecoilURLSyncTransit(); // $ExpectError
RecoilURLSyncTransit({
  children: null,
  storeKey,
  location: {part: 'queryParams'},
  serialize: String, // $ExpectError
  deserialize: (x: string) => x,
});
RecoilURLSyncTransit({
  children: null,
  storeKey,
  location: {part: 'queryParams'},
});
RecoilURLSyncTransit({
  children: null,
  storeKey,
  location: {part: 'queryParams'},
  handlers: [
    {
      class: MyClass,
      tag: 'TAG',
      write: inst => inst.prop,
      read: _x => new MyClass(),
    },
  ],
});
