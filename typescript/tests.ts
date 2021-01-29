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
  waitForAll, waitForAllSettled, waitForAny, waitForNone
} from 'recoil';

/* eslint-disable @typescript-eslint/no-explicit-any */

// DefaultValue
new DefaultValue();

// atom
const myAtom = atom({
  key: 'MyAtom',
  default: 5,
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

useGetRecoilValueInfo_UNSTABLE(myAtom); // $ExpectType AtomInfo<number>
useGetRecoilValueInfo_UNSTABLE(mySelector2); // $ExpectType AtomInfo<string>
useGetRecoilValueInfo_UNSTABLE({}); // $ExpectError

useRecoilCallback(({ snapshot, set, reset, gotoSnapshot }) => async () => {
  snapshot; // $ExpectType Snapshot
  snapshot.getID(); // $ExpectType SnapshotID
  await snapshot.getPromise(mySelector1); // $ExpectType number
  const loadable = snapshot.getLoadable(mySelector1); // $ExpectType Loadable<number>

  gotoSnapshot(snapshot);

  gotoSnapshot(3); // $ExpectError
  gotoSnapshot(myAtom); // $ExpectError

  loadable.contents; // $ExpectType number | LoadablePromise<number> | Error
  loadable.state; // $ExpectType "hasValue" | "loading" | "hasError"

  set(myAtom, 5);
  set(myAtom, 'hello'); // $ExpectError
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

// useRecoilBridgeAcrossReactRoots()
const RecoilBridgeComponent: typeof RecoilBridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();
RecoilBridgeComponent({});
// eslint-disable-next-line @typescript-eslint/no-empty-function
RecoilBridgeComponent({initializeState: () => {}}); // $ExpectError

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
 * effects_UNSTABLE on atom()
 */
{
  atom({
    key: 'thisismyrandomkey',
    default: 0,
    effects_UNSTABLE: [
      ({setSelf, onSet, resetSelf}) => {
        setSelf(1);
        setSelf('a'); // $ExpectError

        onSet(val => {
          val; // $ExpectType number | DefaultValue
        });
        onSet('a'); // $ExpectError

        resetSelf();
        resetSelf('a'); // $ExpectError
      },
    ],
  });
}

/**
 * effects_UNSTABLE on atomFamily()
 */
{
  atomFamily({
    key: 'myrandomatomfamilykey',
    default: (param: number) => param,
    effects_UNSTABLE: (param) => [
      ({setSelf, onSet, resetSelf}) => {
        param; // $ExpectType number

        setSelf(1);
        setSelf('a'); // $ExpectError

        onSet(val => {
          val; // $ExpectType number | DefaultValue
        });
        onSet('a'); // $ExpectError

        resetSelf();
        resetSelf('a'); // $ExpectError
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

/* eslint-enable @typescript-eslint/no-explicit-any */
