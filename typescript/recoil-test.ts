// Minimum TypeScript Version: 3.9

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @oncall recoil
 */

 import {
  atom,
  atomFamily,
  constSelector, DefaultValue,
  errorSelector, isRecoilValue,
  noWait, readOnlySelector, RecoilBridge, RecoilRoot,
  RecoilValue, RecoilState, RecoilValueReadOnly,
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
import * as React from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

// DefaultValue
new DefaultValue();

// atom
const myAtom: RecoilState<number> = atom({
  key: 'MyAtom',
  default: 5,
});

const myAtomWithoutDefault: RecoilState<number> = atom<number>({
  key: 'MyAtomWithoutDefault',
});

{
  const atom1: RecoilState<number> = atom<number>({
    key: 'Key',
    default: RecoilLoadable.of(123),
  });

  const atom2: RecoilState<number> = atom({
    key: 'Key',
    default: atom.value(123),
  });
}

// selector
const mySelector1: RecoilValue<number> = selector({
  key: 'MySelector1',
  get: () => 5,
});

const mySelector2: RecoilValue<string> = selector({
  key: 'MySelector2',
  get: () => '',
});

{
  const mySelector3: RecoilValue<number> = selector({
    key: 'MySelector3',
    get: () => RecoilLoadable.of(123),
  });

  const mySelector4: RecoilValue<number> = selector({
    key: 'MySelector3',
    get: () => selector.value(123),
  });
}

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
RecoilRoot({children: React.createElement('div')}); // $ExpectType ReactElement<any, any> | null
RecoilRoot({ // $ExpectType ReactElement<any, any> | null
  initializeState: ({ set, reset }) => {
    set(myAtom, 5);
    reset(myAtom);

    set(readOnlySelectorSel, 2); // $ExpectError
    set(writeableSelector, 10);
    setUnvalidatedAtomValues({}); // $ExpectError
    set(writeableSelector, new DefaultValue());
  },
  children: React.createElement('div'),
});
RecoilRoot({ // $ExpectType ReactElement<any, any> | null
  override: true,
  children: React.createElement('div'),
});
RecoilRoot({ // $ExpectType ReactElement<any, any> | null
  override: false,
  children: React.createElement('div'),
});

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
const t8: string | number = useRecoilValue<number | string>(waAtom);
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
  const loadable: Loadable<number> = snapshot.getLoadable(mySelector1);

  gotoSnapshot(snapshot);

  gotoSnapshot(3); // $ExpectError
  gotoSnapshot(myAtom); // $ExpectError

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const state: 'hasValue' | 'hasError' | 'loading' = loadable.state;
  loadable.contents; // $ExpectType any
  switch (loadable.state) {
    case 'hasValue':
      loadable.contents; // $ExpectType number
      break;
    case 'hasError':
      loadable.contents; // $ExpectType any
      break;
    case 'loading':
      loadable.contents; // $ExpectType Promise<number>
      break;
  }

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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const state: 'hasValue' | 'hasError' | 'loading' = loadable.state;
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
  RecoilBridgeComponent({children: React.createElement('div')});
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  RecoilBridgeComponent({
    children: React.createElement('div'),
    initializeState: () => {}, // $ExpectError
  });
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const myAsyncAtomFamily: (number: number) => RecoilState<number> =
    atomFamily<number, number>({
      key: 'MyAsyncAtomFamily',
      default: (param: number) => Promise.resolve(param),
    });
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

  class MySerializableClass {
    toJSON() {
      return 'test';
    }
  }
  const myJsonSerializableSelectorFam = selectorFamily({
    key: 'mySelectorFam1',
    get: (param: {date: Date, class: MySerializableClass}) => () =>
      (param.date.toString() + JSON.stringify(param.class.toJSON())),
  });
  myJsonSerializableSelectorFam({ date: new Date(), class: new MySerializableClass() });

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

  const selectorFamilyError1 = selectorFamily({ // $ExpectError
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

  const selectorFamilyError3 = selectorFamily({
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

  constSelector(new Map([['k', 'v']])); // $ExpectType RecoilValueReadOnly<Map<string, string>>
  constSelector(new Set(['str'])); // $ExpectType RecoilValueReadOnly<Set<string>>

  class MyClass {}
  constSelector(new MyClass()); // $ExpectError
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
  RecoilLoadable.loading(); // $ExpectType LoadingLoadable<any>

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
