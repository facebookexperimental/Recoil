import {
  DefaultValue,
  RecoilRoot,
  RecoilBridge,
  RecoilValueReadOnly,
  atom,
  selector,
  useRecoilValue,
  useRecoilValueLoadable,
  useRecoilState,
  useRecoilStateLoadable,
  useSetRecoilState,
  useResetRecoilState,
  useRecoilCallback,
  isRecoilValue,
  RecoilState,
  atomFamily,
  selectorFamily,
  constSelector,
  errorSelector,
  readOnlySelector,
  noWait,
  waitForNone,
  waitForAny,
  waitForAll,
  useRecoilTransactionObserver_UNSTABLE,
  useGotoRecoilSnapshot,
  Snapshot,
  SnapshotID, // eslint-disable-line @typescript-eslint/no-unused-vars
  useRecoilSnapshot,
  useRecoilBridgeAcrossReactRoots_UNSTABLE,
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
  },
});

const writeableSelector = selector({
  key: 'WriteableSelector',
  get: ({ get }) => {
    get(mySelector1) + 10;
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
    set(writeableSelector, 10); // $ExpectError
    setUnvalidatedAtomValues({}); // $ExpectError
    set(writeableSelector, new DefaultValue());
  },
});

// Hooks
const roAtom: RecoilValueReadOnly<string> = {} as any;
const waAtom: RecoilState<string> = {} as any;
const nsAtom: RecoilState<number | string> = {} as any; // number or string

useRecoilValue(roAtom);
useRecoilValue(waAtom);

useRecoilState(roAtom); // $ExpectError
useRecoilState(waAtom);

useRecoilState<number>(waAtom); // $ExpectError
useRecoilState<number | string>(waAtom); // $ExpectError
useRecoilValue<number>(waAtom); // $ExpectError
useRecoilValue<number | string>(waAtom);
useRecoilValue<number>(nsAtom); // $ExpectError

useRecoilValue(myAtom);
useRecoilValue(mySelector1);
useRecoilValue(readOnlySelectorSel);
useRecoilValue(writeableSelector);
useRecoilValue({}); // $ExpectError

useRecoilValueLoadable(myAtom);
useRecoilValueLoadable(readOnlySelectorSel);
useRecoilValueLoadable(writeableSelector);
useRecoilValueLoadable({}); // $ExpectError

useRecoilState(myAtom);
useRecoilState(writeableSelector);
useRecoilState(readOnlySelectorSel); // $ExpectError
useRecoilState({}); // $ExpectError

useRecoilStateLoadable(myAtom);
useRecoilStateLoadable(writeableSelector);
useRecoilStateLoadable(readOnlySelectorSel); // $ExpectError
useRecoilStateLoadable({}); // $ExpectError

useSetRecoilState(myAtom);
useSetRecoilState(writeableSelector);
useSetRecoilState(readOnlySelectorSel); // $ExpectError
useSetRecoilState({}); // $ExpectError

useResetRecoilState(myAtom);
useResetRecoilState(writeableSelector);
useResetRecoilState(readOnlySelectorSel); // $ExpectError
useResetRecoilState({}); // $ExpectError

useRecoilCallback(({ snapshot, set, reset, gotoSnapshot }) => async () => {
  snapshot; // $ExpectType Snapshot
  snapshot.getID(); // $ExpectType SnapshotID
  await snapshot.getPromise(mySelector1); // $ExpectType number
  const loadable = snapshot.getLoadable(mySelector1); // $ExpectType Loadable<number>

  gotoSnapshot(snapshot);

  gotoSnapshot(3); // $ExpectError
  gotoSnapshot(myAtom); // $ExpectError

  loadable.contents; // $ExpectType number | Error | LoadablePromise<number>
  loadable.state; // $ExpectType "hasError" | "hasValue" | "loading"

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
      snapshot.getLoadable(myAtom);
      snapshot.getPromise(mySelector1);

      previousSnapshot.getLoadable(myAtom);
      previousSnapshot.getPromise(mySelector2);
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

/* eslint-enable @typescript-eslint/no-explicit-any */
