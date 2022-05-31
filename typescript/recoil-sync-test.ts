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
  useRecoilSync,
  syncEffect,

  // Recoil Sync URL
  useRecoilURLSync,
  useRecoilURLSyncJSON,
  useRecoilURLSyncTransit,
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

// useRecoilSync()
useRecoilSync(); // $ExpectError
useRecoilSync({bad: 'BAD'}); // $ExpectError
useRecoilSync({storeKey});
useRecoilSync({storeKey: 0}); // $ExpectError
useRecoilSync({read: (x: ItemKey) => undefined});
useRecoilSync({read: (x: ItemKey) => 'any'});
useRecoilSync({read: (x: ItemKey) => DEFAULT_VALUE});
useRecoilSync({read: (x: ItemKey) => Promise.resolve('any')});
useRecoilSync({read: (x: ItemKey) => RecoilLoadable.of('any')});
useRecoilSync({read: (x: number) => 'BAD'}); // $ExpectError
useRecoilSync({write: ({diff, allItems}) => {
  const diffMap: Map<ItemKey, unknown> = diff;
  const allItemsMap: Map<ItemKey, unknown> = allItems;
  const bad1: Map<ItemKey, string> = allItems; // $ExpectError
  const bad2: string = allItems; // $ExpectError
}});
useRecoilSync({write: ({bad}) => {}}); // $ExpectError
useRecoilSync({listen: ({updateItem, updateAllKnownItems}) => {
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

// useRecoilURLSync()
useRecoilURLSync(); // $ExpectError
useRecoilURLSync({
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

// useRecoilURLSyncJSON()
useRecoilURLSyncJSON(); // $ExpectError
useRecoilURLSyncJSON({
  storeKey,
  location: {part: 'queryParams'},
  serialize: String, // $ExpectError
  deserialize: (x: string) => x,
});
useRecoilURLSyncJSON({
  storeKey,
  location: {part: 'queryParams'},
});

// useRecoilURLSyncTransit()
class MyClass {
  prop: number;
}
useRecoilURLSyncTransit(); // $ExpectError
useRecoilURLSyncTransit({
  storeKey,
  location: {part: 'queryParams'},
  serialize: String, // $ExpectError
  deserialize: (x: string) => x,
});
useRecoilURLSyncTransit({
  storeKey,
  location: {part: 'queryParams'},
});
useRecoilURLSyncTransit({
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
