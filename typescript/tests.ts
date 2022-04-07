/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 */

 import {
  atom,
  atomFamily,
  constSelector, DefaultValue,
  errorSelector, isRecoilValue,
  noWait, readOnlySelector, RecoilBridge, RecoilRoot,
  RecoilState, RecoilValueReadOnly,
  selector,
  selectorFamily,
  Snapshot,
  snapshot_UNSTABLE,
  useGetRecoilValueInfo_UNSTABLE, useGotoRecoilSnapshot,
  useRecoilBridgeAcrossReactRoots_UNSTABLE, useRecoilCallback,
  useRecoilSnapshot, useRecoilState,
  useRecoilStateLoadable,
  useRecoilTransactionObserver_UNSTABLE, useRecoilValue,
  useRecoilValueLoadable,
  useResetRecoilState, useSetRecoilState,
  waitForAll, waitForAllSettled, waitForAny, waitForNone,
  Loadable, RecoilLoadable,
  useRecoilTransaction_UNSTABLE,
  useRecoilRefresher_UNSTABLE,
  useRecoilStoreID,
  useRecoilValue_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilState_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE,
} from 'recoil';
import { number } from 'refine';

/* eslint-disable @typescript-eslint/no-explicit-any */

// DefaultValue
new DefaultValue();

// atom
const myAtom: RecoilState<number> = atom({
  key: 'MyAtom',
  default: 5,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const myAtomWithoutDefault: RecoilState<number> = atom<number>({
  key: 'MyAtomWithoutDefault',
});

// selector
const mySelector1 = selector({
  key: 'MySelector1',
  get: () => 5,
});

const mySelector2 = selector({
  key: 'MySelector2',
  get: () => '',
});

// $ExpectError
selector({
  key: 'ExpectedError',
  get: () => '',
}) as RecoilValueReadOnly<boolean>;

const readOnlySelectorSel = selector({
  key: 'ReadOnlySelector',
  get: ({ get }) => {
      get(myAtom) + 10;
      get(mySelector1);
      get(5); // $ExpectError
      return 5;
  },
});

const writeableSelector = selector({
  key: 'WriteableSelector',
  get: ({ get }) => {
    return get(mySelector1) + 10;
  },
  set: ({ get, set, reset }) => {
    get(myAtom);
    set(myAtom, 5);
    set(myAtom, 'hello'); // $ExpectError
    set(myAtom, new DefaultValue());
    reset(myAtom);

    set(readOnlySelectorSel, 2); // $ExpectError
    reset(readOnlySelectorSel); // $ExpectError
  },
});

const callbackSelector = selector({
  key: 'CallbackSelector',
  get: ({ getCallback }) => {
    return getCallback(({snapshot, set, reset, refresh, transact_UNSTABLE}) => () => {
      set(myAtom, 5);
      reset(myAtom);
      refresh(myAtom);

      transact_UNSTABLE(({get, set, reset}) => {
        get(myAtom); // $ExpectType number
        set(myAtom, 5);
        reset(myAtom);
      });

      const ret = snapshot.getPromise(mySelector1); // $ExpectType Promise<number>
      return ret;
    });
  }
});
useRecoilValue(callbackSelector); // $ExpectType () => Promise<number>

const selectorError1 = selector({ // $ExpectError
  key: 'SelectorError1',
  // Missing get()
});
selectorError1;

const selectorError2 = selector({
  key: 'SelectorError2',
  get: () => null,
  extraProp: 'error', // $ExpectError
});
selectorError2;

const selectorError3 = selector({
  key: 'SelectorError3',
  get: ({badCallback}) => null, // $ExpectError
});
selectorError3;

// RecoilRoot
RecoilRoot({});
RecoilRoot({
  initializeState: ({ set, reset }) => {
    set(myAtom, 5);
    reset(myAtom);

    set(readOnlySelectorSel, 2); // $ExpectError
    set(writeableSelector, 10);
    setUnvalidatedAtomValues({}); // $ExpectError
    set(writeableSelector, new DefaultValue());
  },
});
RecoilRoot({override: true});
RecoilRoot({override: false});

// Loadable
function loadableTest(loadable: Loadable<number>) {
  switch (loadable.state) {
    case 'hasValue':
      loadable.contents; // $ExpectType number
      loadable.getValue(); // $ExpectType number
      loadable.toPromise(); // $ExpectType Promise<number>
      loadable.valueMaybe(); // $ExpectType number
      loadable.valueOrThrow(); // $ExpectType number
      loadable.errorMaybe(); // $ExpectType undefined
      loadable.errorOrThrow(); // $ExpectType any
      loadable.promiseMaybe(); // $ExpectType undefined
      loadable.promiseOrThrow(); // $ExpectType Promise<number>
      break;
    case 'hasError':
      loadable.contents; // $ExpectType any
      loadable.getValue(); // $ExpectType number
      loadable.toPromise(); // $ExpectType Promise<number>
      loadable.valueMaybe(); // $ExpectType undefined
      loadable.valueOrThrow(); // $ExpectType number
      loadable.errorMaybe(); // $ExpectType any
      loadable.errorOrThrow(); // $ExpectType any
      loadable.promiseMaybe(); // $ExpectType undefined
      loadable.promiseOrThrow(); // $ExpectType Promise<number>
      break;
    case 'loading':
      loadable.contents; // $ExpectType Promise<number>
      loadable.getValue(); // $ExpectType number
      loadable.toPromise(); // $ExpectType Promise<number>
      loadable.valueMaybe(); // $ExpectType undefined
      loadable.valueOrThrow(); // $ExpectType number
      loadable.errorMaybe(); // $ExpectType undefined
      loadable.errorOrThrow(); // $ExpectType any
      loadable.promiseMaybe(); // $ExpectType Promise<number>
      loadable.promiseOrThrow(); // $ExpectType Promise<number>
      break;
  }

  loadable.valueMaybe()?.toString();
  loadable.errorMaybe()?.toString();
  loadable.is(loadable); // $ExpectType boolean
}

// Hooks
const roAtom: RecoilValueReadOnly<string> = {} as any;
const waAtom: RecoilState<string> = {} as any;
const nsAtom: RecoilState<number | string> = {} as any; // number or string

useRecoilValue(roAtom); // $ExpectType string
useRecoilValue(waAtom); // $ExpectType string

useRecoilState(roAtom); // $ExpectError
useRecoilState(waAtom); // $ExpectType [string, SetterOrUpdater<string>]

useRecoilState<number>(waAtom); // $ExpectError
useRecoilState<number | string>(waAtom); // $ExpectError
useRecoilValue<number>(waAtom); // $ExpectError
useRecoilValue<number | string>(waAtom); // $ExpectType string | number
useRecoilValue<number>(nsAtom); // $ExpectError

useRecoilValue(myAtom); // $ExpectType number
useRecoilValue(mySelector1); // $ExpectType number
useRecoilValue(readOnlySelectorSel); // $ExpectType number
useRecoilValue(writeableSelector); // $ExpectType number
useRecoilValue({}); // $ExpectError

useRecoilValueLoadable(myAtom); // $ExpectType Loadable<number>
useRecoilValueLoadable(readOnlySelectorSel); // $ExpectType Loadable<number>
useRecoilValueLoadable(writeableSelector); // $ExpectType Loadable<number>
useRecoilValueLoadable({}); // $ExpectError

useRecoilState(myAtom); // $ExpectType [number, SetterOrUpdater<number>]
useRecoilState(writeableSelector); // $ExpectType [number, SetterOrUpdater<number>]
useRecoilState(readOnlySelectorSel); // $ExpectError
useRecoilState({}); // $ExpectError

useRecoilStateLoadable(myAtom);
useRecoilStateLoadable(writeableSelector);
useRecoilStateLoadable(readOnlySelectorSel); // $ExpectError
useRecoilStateLoadable({}); // $ExpectError

useSetRecoilState(myAtom); // $ExpectType SetterOrUpdater<number>
useSetRecoilState(writeableSelector); // $ExpectType SetterOrUpdater<number>
useSetRecoilState(readOnlySelectorSel); // $ExpectError
useSetRecoilState({}); // $ExpectError

useResetRecoilState(myAtom); // $ExpectType Resetter
useResetRecoilState(writeableSelector); // $ExpectType Resetter
useResetRecoilState(readOnlySelectorSel); // $ExpectError
useResetRecoilState({}); // $ExpectError

useGetRecoilValueInfo_UNSTABLE(myAtom); // $ExpectError
useGetRecoilValueInfo_UNSTABLE()(myAtom); // $ExpectType RecoilStateInfo<number>
useGetRecoilValueInfo_UNSTABLE()(mySelector2); // $ExpectType RecoilStateInfo<string>
useGetRecoilValueInfo_UNSTABLE()({}); // $ExpectError

useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(roAtom); // $ExpectType string
useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(waAtom); // $ExpectType string
useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(myAtom); // $ExpectType number
useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(mySelector1); // $ExpectType number
useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(readOnlySelectorSel); // $ExpectType number
useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(writeableSelector); // $ExpectType number
useRecoilValue_TRANSITION_SUPPORT_UNSTABLE({}); // $ExpectError
useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE(myAtom); // $ExpectType Loadable<number>
useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE(readOnlySelectorSel); // $ExpectType Loadable<number>
useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE(writeableSelector); // $ExpectType Loadable<number>
useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE({}); // $ExpectError
useRecoilState_TRANSITION_SUPPORT_UNSTABLE(myAtom); // $ExpectType [number, SetterOrUpdater<number>]
useRecoilState_TRANSITION_SUPPORT_UNSTABLE(writeableSelector); // $ExpectType [number, SetterOrUpdater<number>]
useRecoilState_TRANSITION_SUPPORT_UNSTABLE(readOnlySelectorSel); // $ExpectError
useRecoilState_TRANSITION_SUPPORT_UNSTABLE({}); // $ExpectError

useRecoilCallback(({ snapshot, set, reset, refresh, gotoSnapshot, transact_UNSTABLE }) => async () => {
  snapshot; // $ExpectType Snapshot
  snapshot.getID(); // $ExpectType SnapshotID
  await snapshot.getPromise(mySelector1); // $ExpectType number
  const loadable = snapshot.getLoadable(mySelector1); // $ExpectType Loadable<number>

  gotoSnapshot(snapshot);

  gotoSnapshot(3); // $ExpectError
  gotoSnapshot(myAtom); // $ExpectError

  loadable.state; // $ExpectType "hasValue" | "loading" | "hasError"
  loadable.contents; // $ExpectType any

  set(myAtom, 5);
  set(myAtom, 'hello'); // $ExpectError
  reset(myAtom);
  refresh(myAtom);

  const release = snapshot.retain(); // $ExpectType () => void
  release(); // $ExpectType void
  snapshot.isRetained(); // $ExpectType boolean

  transact_UNSTABLE(({get, set, reset}) => {
    const x: number = get(myAtom); // eslint-disable-line @typescript-eslint/no-unused-vars
    set(myAtom, 1);
    set(myAtom, x => x + 1);
    reset(myAtom);
  });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const transact: (p: number) => void = useRecoilTransaction_UNSTABLE(({get, set, reset}) => (p: number) => {
  const x: number = get(myAtom); // eslint-disable-line @typescript-eslint/no-unused-vars
  set(myAtom, 1);
  set(myAtom, x => x + 1);
  reset(myAtom);
});

/**
 * useRecoilTransactionObserver_UNSTABLE()
 */
{
  useRecoilTransactionObserver_UNSTABLE(
    ({snapshot, previousSnapshot}) => {
      snapshot.getLoadable(myAtom); // $ExpectType Loadable<number>
      snapshot.getPromise(mySelector1); // $ExpectType Promise<number>
      snapshot.getPromise(mySelector2); // $ExpectType Promise<string>

      previousSnapshot.getLoadable(myAtom); // $ExpectType Loadable<number>
      previousSnapshot.getPromise(mySelector1); // $ExpectType Promise<number>
      previousSnapshot.getPromise(mySelector2); // $ExpectType Promise<string>

      for (const node of Array.from(snapshot.getNodes_UNSTABLE({isModified: true}))) {
        const loadable = snapshot.getLoadable(node); // $ExpectType Loadable<unknown>
        loadable.state; // $ExpectType "hasValue" | "loading" | "hasError"
      }
    },
  );
}

/**
 * useGotoRecoilSnapshot()
 */
{
  const snapshot: Snapshot = ({} as any);

  const gotoSnap = useGotoRecoilSnapshot();

  gotoSnap(snapshot);

  gotoSnap(5); // $ExpectError
  gotoSnap(myAtom); // $ExpectError
}

/**
 * useRecoilSnapshot()
 */
{
  useRecoilSnapshot(); // $ExpectType Snapshot
}

/**
 * useRecoilRefresher()
 */
{
  useRecoilRefresher_UNSTABLE(); // $ExpectError
  useRecoilRefresher_UNSTABLE(false); // $ExpectError
  const refresher = useRecoilRefresher_UNSTABLE(mySelector1);
  refresher(false); // $ExpectError
  refresher(mySelector1); // $ExpectError
  refresher(); // $ExpectType void
}

/**
 * useRecoilBridgeAcrossReactRoots()
 */
{
  const RecoilBridgeComponent: typeof RecoilBridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();
  RecoilBridgeComponent({});
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  RecoilBridgeComponent({initializeState: () => {}}); // $ExpectError
}

/**
 * ueRecoilStoreID()
 */
{
  useRecoilStoreID(2); // $ExpectError
  useRecoilStoreID(); // $ExpectType StoreID
}

// Other
isRecoilValue(4);
isRecoilValue(myAtom);
isRecoilValue(null);
isRecoilValue(mySelector1);

/**
 * recoil values are read-only
 */
 {
  const myArr = [{a: 10}];
  const myObj = {
    a: 10,
    b: {
      c: 10,
      d: (a: number) => a,
    },
  };
  const myMap = new Map([['', 1]]);
  const mySet = new Set(['']);

  const myArrAtom = atom({
    key: 'myArrAtom',
    default: myArr,
  });

  const myObjAtom = atom({
    key: 'myObjAtom',
    default: myObj,
  });

  const myMapAtom = atom({
    key: 'myMapAtom',
    default: myMap,
  });

  const mySetAtom = atom({
    key: 'mySetAtom',
    default: mySet,
  });

  const myFnAtom = atom({
    key: 'myFnAtom',
    default: myObj.b.d,
  });

  const myArrSel = selector({
    key: 'myArrSel',
    get: () => myArr,
  });

  const myObjSel = selector({
    key: 'myObjSel',
    get: () => myObj,
  });

  const myMapSel = selector({
    key: 'myMapSel',
    get: () => myMap,
  });

  const mySetSel = selector({
    key: 'mySetSel',
    get: () => mySet,
  });

  const myFnSel = selector({
    key: 'myFnSel',
    get: () => myObj.b.d,
  });

  const myArrSelFam = selectorFamily({
    key: 'myArrSel',
    get: (a: string) => () => myArr,
  });

  const myObjSelFam = selectorFamily({
    key: 'myObjSel',
    get: (a: string) => () => myObj,
  });

  const myMapSelFam = selectorFamily({
    key: 'myMapSel',
    get: (a: string) => () => myMap,
  });

  const mySetSelFam = selectorFamily({
    key: 'mySetSel',
    get: (a: string) => () => mySet,
  });

  const myFnSelFam = selectorFamily({
    key: 'myFnSel',
    get: (a: string) => () => myObj.b.d,
  });

  const myArrAtomFam = atomFamily({
    key: 'myArrSel',
    default: (a: string) => myArr,
  });

  const myObjAtomFam = atomFamily({
    key: 'myObjSel',
    default: (a: string) => myObj,
  });

  const myMapAtomFam = atomFamily({
    key: 'myMapSel',
    default: (a: string) => myMap,
  });

  const mySetAtomFam = atomFamily({
    key: 'mySetSel',
    default: (a: string) => mySet,
  });

  const myFnAtomFam = atomFamily({
    key: 'myFnSel',
    default: (a: string) => myObj.b.d,
  });

  const arr1 = useRecoilValue(myArrAtom);
  const obj1 = useRecoilValue(myObjAtom);
  const map1 = useRecoilValue(myMapAtom);
  const set1 = useRecoilValue(mySetAtom);
  const fn1 = useRecoilValue(myFnAtom);

  arr1[0].a = 10; // $ExpectError
  arr1.push(1); // $ExpectError
  arr1.reverse(); // $ExpectError
  arr1.sort(); // $ExpectError

  arr1.every(() => {}); // OK because immutable
  arr1.filter(() => {}); // OK because immutable

  obj1.a = 2; // $ExpectError
  obj1.b.c = 100;  // $ExpectError

  obj1.b.d(10);
  obj1.b.d = () => {}; // $ExpectError

  map1.set('a', 1); // $ExpectError

  map1.get(''); // OK because immutable
  map1.size;

  set1.add(''); // $ExpectError

  set1.forEach(() => {});

  fn1(10);

  const arr2 = useRecoilValue(myArrSel);
  const obj2 = useRecoilValue(myObjSel);
  const map2 = useRecoilValue(myMapSel);
  const set2 = useRecoilValue(mySetSel);
  const fn2 = useRecoilValue(myFnSel);

  arr2[0].a = 10; // $ExpectError
  arr2.push(1); // $ExpectError
  arr2.reverse(); // $ExpectError
  arr2.sort(); // $ExpectError

  arr2.every(() => {}); // OK because immutable
  arr2.filter(() => {}); // OK because immutable

  obj2.a = 2; // $ExpectError
  obj2.b.c = 100;  // $ExpectError

  obj2.b.d(10);
  obj2.b.d = () => {}; // $ExpectError

  map2.set('a', 1); // $ExpectError

  map2.get(''); // OK because immutable
  map2.size;

  set2.add(''); // $ExpectError

  set2.forEach(() => {});

  fn1(10);

  const arr3 = useRecoilValue(myArrSelFam(''));
  const obj3 = useRecoilValue(myObjSelFam(''));
  const map3 = useRecoilValue(myMapSelFam(''));
  const set3 = useRecoilValue(mySetSelFam(''));
  const fn3 = useRecoilValue(myFnSelFam(''));

  arr3[0].a = 10; // $ExpectError
  arr3.push(1); // $ExpectError
  arr3.reverse(); // $ExpectError
  arr3.sort(); // $ExpectError

  arr3.every(() => {}); // OK because immutable
  arr3.filter(() => {}); // OK because immutable

  obj3.a = 2; // $ExpectError
  obj3.b.c = 100;  // $ExpectError

  obj3.b.d(10);

  obj3.b.d = () => {}; // $ExpectError
  map3.set('a', 1); // $ExpectError

  map3.get(''); // OK because immutable

  map3.size;

  set3.add(''); // $ExpectError

  set3.forEach(() => {});

  fn1(10);

  const arr4 = useRecoilValue(myArrAtomFam(''));
  const obj4 = useRecoilValue(myObjAtomFam(''));
  const map4 = useRecoilValue(myMapAtomFam(''));
  const set4 = useRecoilValue(mySetAtomFam(''));
  const fn4 = useRecoilValue(myFnAtomFam(''));

  arr4[0].a = 10; // $ExpectError
  arr4.push(1); // $ExpectError
  arr4.reverse(); // $ExpectError
  arr4.sort(); // $ExpectError

  arr4.every(() => {}); // OK because immutable
  arr4.filter(() => {}); // OK because immutable

  obj4.a = 2; // $ExpectError
  obj4.b.c = 100;  // $ExpectError

  obj4.b.d(10);

  obj4.b.d = () => {}; // $ExpectError
  map4.set('a', 1); // $ExpectError

  map4.get(''); // OK because immutable

  map4.size;

  set4.add(''); // $ExpectError

  set4.forEach(() => {});

  fn1(10);
}

/**
 * recoil values are mutable when dangerouslyAllowMutability is set
 */
 {
  const myArr = [{a: 10}];
  const myObj = {
    a: 10,
    b: {
      c: 10,
      d: (a: number) => a,
    },
  };
  const myMap = new Map([['', 1]]);
  const mySet = new Set(['']);

  const myArrAtom = atom({
    key: 'myArrAtom',
    default: myArr,
    dangerouslyAllowMutability: true,
  });

  const myObjAtom = atom({
    key: 'myObjAtom',
    default: myObj,
    dangerouslyAllowMutability: true,
  });

  const myMapAtom = atom({
    key: 'myMapAtom',
    default: myMap,
    dangerouslyAllowMutability: true,
  });

  const mySetAtom = atom({
    key: 'mySetAtom',
    default: mySet,
    dangerouslyAllowMutability: true,
  });

  const myFnAtom = atom({
    key: 'myFnAtom',
    default: myObj.b.d,
    dangerouslyAllowMutability: true,
  });

  const myArrSel = selector({
    key: 'myArrSel',
    get: () => myArr,
    dangerouslyAllowMutability: true,
  });

  const myObjSel = selector({
    key: 'myObjSel',
    get: () => myObj,
    dangerouslyAllowMutability: true,
  });

  const myMapSel = selector({
    key: 'myMapSel',
    get: () => myMap,
    dangerouslyAllowMutability: true,
  });

  const mySetSel = selector({
    key: 'mySetSel',
    get: () => mySet,
    dangerouslyAllowMutability: true,
  });

  const myFnSel = selector({
    key: 'myFnSel',
    get: () => myObj.b.d,
    dangerouslyAllowMutability: true,
  });

  const myArrSelFam = selectorFamily({
    key: 'myArrSel',
    get: (a: string) => () => myArr,
    dangerouslyAllowMutability: true,
  });

  const myObjSelFam = selectorFamily({
    key: 'myObjSel',
    get: (a: string) => () => myObj,
    dangerouslyAllowMutability: true,
  });

  const myMapSelFam = selectorFamily({
    key: 'myMapSel',
    get: (a: string) => () => myMap,
    dangerouslyAllowMutability: true,
  });

  const mySetSelFam = selectorFamily({
    key: 'mySetSel',
    get: (a: string) => () => mySet,
    dangerouslyAllowMutability: true,
  });

  const myFnSelFam = selectorFamily({
    key: 'myFnSel',
    get: (a: string) => () => myObj.b.d,
    dangerouslyAllowMutability: true,
  });

  const myArrAtomFam = atomFamily({
    key: 'myArrSel',
    default: (a: string) => myArr,
    dangerouslyAllowMutability: true,
  });

  const myObjAtomFam = atomFamily({
    key: 'myObjSel',
    default: (a: string) => myObj,
    dangerouslyAllowMutability: true,
  });

  const myMapAtomFam = atomFamily({
    key: 'myMapSel',
    default: (a: string) => myMap,
    dangerouslyAllowMutability: true,
  });

  const mySetAtomFam = atomFamily({
    key: 'mySetSel',
    default: (a: string) => mySet,
    dangerouslyAllowMutability: true,
  });

  const myFnAtomFam = atomFamily({
    key: 'myFnSel',
    default: (a: string) => myObj.b.d,
    dangerouslyAllowMutability: true,
  });

  const arr1 = useRecoilValue(myArrAtom);
  const obj1 = useRecoilValue(myObjAtom);
  const map1 = useRecoilValue(myMapAtom);
  const set1 = useRecoilValue(mySetAtom);
  const fn1 = useRecoilValue(myFnAtom);

  arr1[0].a = 10;
  arr1.push({ a: 1 });
  arr1.reverse();
  arr1.sort();

  arr1.every(() => {});
  arr1.filter(() => {});

  obj1.a = 2;
  obj1.b.c = 100;

  obj1.b.d(10);
  obj1.b.d = () => 5;

  map1.set('a', 1);

  map1.get('');
  map1.size;

  set1.add('');

  set1.forEach(() => {});

  fn1(10);

  const arr2 = useRecoilValue(myArrSel);
  const obj2 = useRecoilValue(myObjSel);
  const map2 = useRecoilValue(myMapSel);
  const set2 = useRecoilValue(mySetSel);
  const fn2 = useRecoilValue(myFnSel);

  arr2[0].a = 10;
  arr2.push({ a: 1 });
  arr2.reverse();
  arr2.sort();

  arr2.every(() => {});
  arr2.filter(() => {});

  obj2.a = 2;
  obj2.b.c = 100;

  obj2.b.d(10);
  obj2.b.d = () => 5;

  map2.set('a', 1);

  map2.get('');
  map2.size;

  set2.add('');

  set2.forEach(() => {});

  fn1(10);

  const arr3 = useRecoilValue(myArrSelFam(''));
  const obj3 = useRecoilValue(myObjSelFam(''));
  const map3 = useRecoilValue(myMapSelFam(''));
  const set3 = useRecoilValue(mySetSelFam(''));
  const fn3 = useRecoilValue(myFnSelFam(''));

  arr3[0].a = 10;
  arr3.push({a: 1});
  arr3.reverse();
  arr3.sort();

  arr3.every(() => {});
  arr3.filter(() => {});

  obj3.a = 2;
  obj3.b.c = 100;

  obj3.b.d(10);

  obj3.b.d = () => 4;
  map3.set('a', 1);

  map3.get('');

  map3.size;

  set3.add('');

  set3.forEach(() => {});

  fn1(10);

  const arr4 = useRecoilValue(myArrAtomFam(''));
  const obj4 = useRecoilValue(myObjAtomFam(''));
  const map4 = useRecoilValue(myMapAtomFam(''));
  const set4 = useRecoilValue(mySetAtomFam(''));
  const fn4 = useRecoilValue(myFnAtomFam(''));

  arr4[0].a = 10;
  arr4.push({a: 1});
  arr4.reverse();
  arr4.sort();

  arr4.every(() => {});
  arr4.filter(() => {});

  obj4.a = 2;
  obj4.b.c = 100;

  obj4.b.d(10);

  obj4.b.d = () => 4;
  map4.set('a', 1);

  map4.get('');

  map4.size;

  set4.add('');

  set4.forEach(() => {});

  fn1(10);
}

/**
 * ================ UTILS ================
 */

/**
 * atomFamily() tests
 */

{
  const myAtomFam = atomFamily({
    key: 'myAtomFam1',
    default: (param: number) => param,
  });

  const atm = myAtomFam(2); // $ExpectType RecoilState<number>
  useRecoilValue(atm); // $ExpectType number

  myAtomFam(''); // $ExpectError

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const myAtomFamilyWithoutDefault: (number: number) => RecoilState<number> =
    atomFamily<number, number>({key: 'MyAtomFamilyWithoutDefault'});
}

/**
 * selectorFamily() tests
 */
{
  const mySelectorFam = selectorFamily({
    key: 'myAtomFam1',
    get: (param: number) => ({ get }) => {
      get(mySelector1); // $ExpectType number

      return param;
    },
  });

  const atm = mySelectorFam(2); // $ExpectType RecoilValueReadOnly<number>
  useRecoilValue(atm); // $ExpectType number

  mySelectorFam(''); // $ExpectError

  useRecoilState(mySelectorFam(3)); // $ExpectError

  const mySelectorFamWritable = selectorFamily({
    key: 'myAtomFam1',
    get: (param: number) => ({ get }) => {
      get(mySelector1); // $ExpectType number
      return param;
    },
    set: (param: number) => () => {
      param; // $ExpectType number
    },
  });

  useRecoilState(mySelectorFamWritable(3))[0]; // $ExpectType number

  const mySelectorFamArray = selectorFamily({
    key: 'myAtomFam1',
    get: (param: ReadonlyArray<number>) => () => [...param, 9],
  });
  mySelectorFamArray([1, 2, 3]);

  const myJsonSerializableSelectorFam = selectorFamily({
    key: 'mySelectorFam1',
    get: (param: {from: Date, to: Date}) => () => (+param.from) - (+param.to),
  });
  myJsonSerializableSelectorFam({ from: new Date(), to: new Date() });

  const callbackSelectorFamily = selectorFamily({
    key: 'CallbackSelector',
    get: (param: number) => ({ getCallback }) => {
      return getCallback(({snapshot}) => async (num: number) => {
        num; // $ExpectType number
        const ret = await snapshot.getPromise(mySelectorFamWritable(param + num)); // $ExpectType number
        return ret;
      });
    }
  });
  useRecoilValue(callbackSelectorFamily('hi')); // $ExpectError
  const cb = useRecoilValue(callbackSelectorFamily(1)); // $ExpectType (num: number) => Promise<number>
  cb('hi'); // $ExpectError
  cb(2); // $ExpectType

  const selectorFamilyError1 = selector({ // $ExpectError
    key: 'SelectorFamilyError1',
    // Missing get()
  });
  selectorFamilyError1;

  const selectorFamilyError2 = selectorFamily({
    key: 'SelectorFamilyError2',
    get: () => () => null,
    extraProp: 'error', // $ExpectError
  });
  selectorFamilyError2;

  const selectorFamilyError3 = selector({
    key: 'SelectorFamilyError3',
    get: () => ({badCallback}) => null, // $ExpectError
  });
  selectorFamilyError3;
}

/**
 * constSelector() tests
 */
{
  const mySel = constSelector(1);
  const mySel2 = constSelector('hello');
  const mySel3 = constSelector([1, 2]);
  const mySel4 = constSelector({ a: 1, b: '2' });

  useRecoilValue(mySel); // $ExpectType 1
  useRecoilValue(mySel2); // $ExpectType "hello"
  useRecoilValue(mySel3); // $ExpectType number[]
  useRecoilValue(mySel4); // $ExpectType { a: number; b: string; }

  constSelector(new Map()); // $ExpectError
  constSelector(new Set()); // $ExpectError
}

/**
 * errorSelector() tests
 */
{
  const mySel = errorSelector('Error msg');

  useRecoilValue(mySel); // $ExpectType never

  errorSelector(2); // $ExpectError
  errorSelector({}); // $ExpectError
}

/**
 * readOnlySelector() tests
 */
{
  const myWritableSel: RecoilState<number> = {} as any;

  readOnlySelector(myWritableSel); // $ExpectType RecoilValueReadOnly<number>
}

/**
 * noWait() tests
 */
{
  const numSel: RecoilValueReadOnly<number> = {} as any;
  const mySel = noWait(numSel);

  useRecoilValue(mySel); // $ExpectType Loadable<number>
}

/**
 * waitForNone() tests
 */
{
  const numSel: RecoilValueReadOnly<number> = {} as any;
  const strSel: RecoilValueReadOnly<string> = {} as any;

  const mySel = waitForNone([numSel, strSel]);
  const mySel2 = waitForNone({ a: numSel, b: strSel });

  useRecoilValue(mySel)[0]; // $ExpectType Loadable<number>
  useRecoilValue(mySel)[1]; // $ExpectType Loadable<string>

  useRecoilValue(mySel2).a; // $ExpectType Loadable<number>
  useRecoilValue(mySel2).b; // $ExpectType Loadable<string>
}

/**
 * waitForAny() tests
 */
{
  const numSel: RecoilValueReadOnly<number> = {} as any;
  const strSel: RecoilValueReadOnly<string> = {} as any;

  const mySel = waitForAny([numSel, strSel]);
  const mySel2 = waitForAny({ a: numSel, b: strSel });

  useRecoilValue(mySel)[0]; // $ExpectType Loadable<number>
  useRecoilValue(mySel)[1]; // $ExpectType Loadable<string>

  useRecoilValue(mySel2).a; // $ExpectType Loadable<number>
  useRecoilValue(mySel2).b; // $ExpectType Loadable<string>
}

/**
 * waitForAll() tests
 */
{
  const numSel: RecoilValueReadOnly<number> = {} as any;
  const strSel: RecoilValueReadOnly<string> = {} as any;

  const mySel = waitForAll([numSel, strSel]);
  const mySel2 = waitForAll({ a: numSel, b: strSel });

  useRecoilValue(mySel)[0]; // $ExpectType number
  useRecoilValue(mySel)[1]; // $ExpectType string

  useRecoilValue(mySel2).a; // $ExpectType number
  useRecoilValue(mySel2).b; // $ExpectType string
}

/**
 * waitForAllSettled() tests
 */
{
  const numSel: RecoilValueReadOnly<number> = {} as any;
  const strSel: RecoilValueReadOnly<string> = {} as any;

  const mySel = waitForAllSettled([numSel, strSel]);
  const mySel2 = waitForAllSettled({ a: numSel, b: strSel });

  useRecoilValue(mySel)[0]; // $ExpectType Loadable<number>
  useRecoilValue(mySel)[1]; // $ExpectType Loadable<string>

  useRecoilValue(mySel2).a; // $ExpectType Loadable<number>
  useRecoilValue(mySel2).b; // $ExpectType Loadable<string>
}

/**
 * effects on atom()
 */
{
  atom({
    key: 'thisismyrandomkey',
    default: 0,
    effects: [
      ({node, storeID, trigger, setSelf, onSet, resetSelf, getPromise, getLoadable, getInfo_UNSTABLE}) => {
        node; // $ExpectType RecoilState<number>
        storeID; // $ExpectType StoreID
        trigger; // $ExpectType "set" | "get"

        setSelf(1);
        setSelf('a'); // $ExpectError

        onSet((val, oldVal, isReset) => {
          val; // $ExpectType number
          oldVal; // $ExpectType number | DefaultValue
          isReset; // $ExpectType boolean
        });
        onSet('a'); // $ExpectError

        resetSelf();
        resetSelf('a'); // $ExpectError

        getPromise(); // $ExpectError
        getPromise('a'); // $ExpectError
        getPromise(node); // $ExpectType Promise<number>
        getLoadable(); // $ExpectError
        getLoadable('a'); // $ExpectError
        getLoadable(node); // $ExpectType Loadable<number>
        getInfo_UNSTABLE(); // $ExpectError
        getInfo_UNSTABLE('a'); // $ExpectError
        getInfo_UNSTABLE(node); // $ExpectType RecoilStateInfo<number>
      },
    ],
  });
}

/**
 * effects on atomFamily()
 */
{
  atomFamily({
    key: 'myrandomatomfamilykey',
    default: (param: number) => param,
    effects: (param) => [
      ({node, storeID, trigger, setSelf, onSet, resetSelf, getPromise, getLoadable, getInfo_UNSTABLE}) => {
        param; // $ExpectType number

        node; // $ExpectType RecoilState<number>
        storeID; // $ExpectType StoreID
        trigger; // $ExpectType "set" | "get"

        setSelf(1);
        setSelf('a'); // $ExpectError

        onSet(val => {
          val; // $ExpectType number
        });
        onSet('a'); // $ExpectError

        resetSelf();
        resetSelf('a'); // $ExpectError

        getPromise(); // $ExpectError
        getPromise('a'); // $ExpectError
        getPromise(node); // $ExpectType Promise<number>
        getLoadable(); // $ExpectError
        getLoadable('a'); // $ExpectError
        getLoadable(node); // $ExpectType Loadable<number>
        getInfo_UNSTABLE(); // $ExpectError
        getInfo_UNSTABLE('a'); // $ExpectError
        getInfo_UNSTABLE(node); // $ExpectType RecoilStateInfo<number>
      },
    ],
  });
}

/**
 * snapshot_UNSTABLE()
 */
{
  snapshot_UNSTABLE(
    mutableSnapshot => mutableSnapshot.set(myAtom, 1)
  )
  .getLoadable(mySelector1)
  .valueOrThrow();
}

{
  snapshot_UNSTABLE(
    mutableSnapshot => mutableSnapshot.set(myAtom, '1') // $ExpectError
  )
  .getLoadable(mySelector1)
  .valueOrThrow();
}

/**
 * cachePolicy_UNSTABLE on selector() and selectorFamily()
 */
{
  selector({
    key: 'ReadOnlySelectorSel_cachePolicy2',
    get: () => {},
    cachePolicy_UNSTABLE: {
      eviction: 'keep-all',
    }
  });

  selector({
    key: 'ReadOnlySelectorSel_cachePolicy3',
    get: () => {},
    cachePolicy_UNSTABLE: { eviction: 'lru' }, // $ExpectError
  });

  selector({
    key: 'ReadOnlySelectorSel_cachePolicy4',
    get: () => {},
    cachePolicy_UNSTABLE: {
      eviction: 'lru',
      maxSize: 10,
    }
  });

  selector({
    key: 'ReadOnlySelectorSel_cachePolicy2',
    get: () => {},
    cachePolicy_UNSTABLE: {
      eviction: 'most-recent',
    }
  });

  selectorFamily({
    key: 'ReadOnlySelectorFSel_cachePolicy2',
    get: () => () => {},
    cachePolicy_UNSTABLE: {
      eviction: 'keep-all',
    }
  });

  selectorFamily({
    key: 'ReadOnlySelectorFSel_cachePolicy3',
    get: () => () => {},
    cachePolicy_UNSTABLE: { eviction: 'lru' }, // $ExpectError
  });

  selectorFamily({
    key: 'ReadOnlySelectorFSel_cachePolicy4',
    get: () => () => {},
    cachePolicy_UNSTABLE: {
      eviction: 'lru',
      maxSize: 10,
    }
  });

  selectorFamily({
    key: 'ReadOnlySelectorFSel_cachePolicy2',
    get: () => () => {},
    cachePolicy_UNSTABLE: {
      eviction: 'most-recent',
    }
  });
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Loadable Factory Tests
 */
 {
  RecoilLoadable.of('x'); // $ExpectType Loadable<string>
  RecoilLoadable.of(Promise.resolve('x')); // $ExpectType Loadable<string>
  RecoilLoadable.of(RecoilLoadable.of('x')); // $ExpectType Loadable<string>
  RecoilLoadable.error('x'); // $ExpectType ErrorLoadable<any>

  const allLoadableArray = RecoilLoadable.all([
    RecoilLoadable.of('str'),
    RecoilLoadable.of(123),
  ]);
  allLoadableArray.map(x => {
    x[0]; // $ExpectType string
    x[1]; // $ExpectType number
    x[2]; // $ExpectError
  });

  const allLoadableObj = RecoilLoadable.all({
    str: RecoilLoadable.of('str'),
    num: RecoilLoadable.of(123),
  });
  allLoadableObj.map(x => {
    x.str; // $ExpectType string
    x.num; // $ExpectType number
    x.void; // $ExpectError
  });

  const mixedAllLoadableArray = RecoilLoadable.all([
    RecoilLoadable.of('str'),
    'str',
    Promise.resolve('str'),
  ]).map(x => {
    x[0]; // $ExpectType string
    x[1]; // $ExpectType string
    x[2]; // $ExpectType string
  });

  RecoilLoadable.isLoadable(false); // $ExpectType boolean
  RecoilLoadable.isLoadable(RecoilLoadable.of('x')); // $ExpectType boolean
}
