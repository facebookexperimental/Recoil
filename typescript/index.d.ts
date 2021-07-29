// Minimum TypeScript Version: 3.7

/**
 * This file is a manual translation of the flow types, which are the source of truth, so we should not introduce new terminology or behavior in this file.
 */

export { };

  import * as React from 'react';

// state.d.ts
type NodeKey = string;

// node.d.ts
export class DefaultValue {
  private __tag: 'DefaultValue';
}

// recoilRoot.d.ts
export type RecoilRootProps = {
  initializeState?: (mutableSnapshot: MutableSnapshot) => void,
  override?: true,
} | {override: false};

export const RecoilRoot: React.FC<RecoilRootProps>;

// Snapshot.d.ts
declare const SnapshotID_OPAQUE: unique symbol;
export interface SnapshotID {
  readonly [SnapshotID_OPAQUE]: true;
}

interface ComponentInfo {
  name: string;
}

interface AtomInfo<T> {
  loadable?: Loadable<T>;
  isActive: boolean;
  isSet: boolean;
  isModified: boolean; // TODO report modified selectors
  type: 'atom' | 'selector' | undefined; // undefined until initialized for now
  deps: Iterable<RecoilValue<T>>;
  subscribers: {
    nodes: Iterable<RecoilValue<T>>,
    components: Iterable<ComponentInfo>,
  };
}

export class Snapshot {
  getID(): SnapshotID;
  getLoadable<T>(recoilValue: RecoilValue<T>): Loadable<T>;
  getPromise<T>(recoilValue: RecoilValue<T>): Promise<T>;
  getNodes_UNSTABLE(opts?: { isModified?: boolean, isInitialized?: boolean }): Iterable<RecoilValue<unknown>>;
  getInfo_UNSTABLE<T>(recoilValue: RecoilValue<T>): AtomInfo<T>;
  map(cb: (mutableSnapshot: MutableSnapshot) => void): Snapshot;
  asyncMap(cb: (mutableSnapshot: MutableSnapshot) => Promise<void>): Promise<Snapshot>;
  retain(): () => void;
}

export class MutableSnapshot extends Snapshot {
  set: SetRecoilState;
  reset: ResetRecoilState;
}

// Effect is called the first time a node is used with a <RecoilRoot>
export type AtomEffect<T> = (param: {
  node: RecoilState<T>,
  trigger: 'set' | 'get',

  // Call synchronously to initialize value or async to change it later
  setSelf: (param:
    | T
    | DefaultValue
    | Promise<T | DefaultValue>
    | ((param: T | DefaultValue) => T | DefaultValue),
  ) => void,
  resetSelf: () => void,

  // Subscribe callbacks to events.
  // Atom effect observers are called before global transaction observers
  onSet: (
    param: (newValue: T, oldValue: T | DefaultValue) => void,
  ) => void,
}) => void | (() => void);

// atom.d.ts
export interface AtomOptions<T> {
  key: NodeKey;
  default: RecoilValue<T> | Promise<T> | T;
  effects_UNSTABLE?: ReadonlyArray<AtomEffect<T>>;
  dangerouslyAllowMutability?: boolean;
}

/**
 * Creates an atom, which represents a piece of writeable state
 */
export function atom<T>(options: AtomOptions<T>): RecoilState<T>;

// selector.d.ts
export type GetRecoilValue = <T>(recoilVal: RecoilValue<T>) => T;
export type GetCallback = <Args extends ReadonlyArray<unknown>, Return>(
  fn: (interface: Readonly<{snapshot: Snapshot}>) => (...args: Args) => Return,
) => (...args: Args) => Return;

export type SetRecoilState = <T>(
    recoilVal: RecoilState<T>,
    newVal: T | DefaultValue | ((prevValue: T) => T | DefaultValue),
) => void;

export type ResetRecoilState = (recoilVal: RecoilState<any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

// export type EqualityPolicy = 'reference' | 'value'; TODO: removing while we discuss long term API

export type EvictionPolicy = 'lru' | 'keep-all' | 'most-recent';

// TODO: removing while we discuss long term API
// export type CachePolicy =
//   | {eviction: 'lru', maxSize: number, equality?: EqualityPolicy}
//   | {eviction: 'none', equality?: EqualityPolicy}
//   | {eviction?: undefined, equality: EqualityPolicy};

// TODO: removing while we discuss long term API
// export interface CachePolicyWithoutEviction {
//   equality: EqualityPolicy;
// }

export type CachePolicyWithoutEquality = {eviction: 'lru', maxSize: number} | {eviction: 'keep-all'} | {eviction: 'most-recent'};

export interface ReadOnlySelectorOptions<T> {
    key: string;
    get: (opts: {
      get: GetRecoilValue,
      getCallback: GetCallback,
    }) => Promise<T> | RecoilValue<T> | T;
    dangerouslyAllowMutability?: boolean;
    cachePolicy_UNSTABLE?: CachePolicyWithoutEquality; // TODO: using the more restrictive CachePolicyWithoutEquality while we discuss long term API
}

export interface ReadWriteSelectorOptions<T> extends ReadOnlySelectorOptions<T> {
  set: (
    opts: {
      set: SetRecoilState;
      get: GetRecoilValue;
      reset: ResetRecoilState;
    },
    newValue: T | DefaultValue,
  ) => void;
}

export function selector<T>(options: ReadWriteSelectorOptions<T>): RecoilState<T>;
export function selector<T>(options: ReadOnlySelectorOptions<T>): RecoilValueReadOnly<T>;

// hooks.d.ts
export type SetterOrUpdater<T> = (valOrUpdater: ((currVal: T) => T) | T) => void;
export type Resetter = () => void;
export interface TransactionInterface_UNSTABLE {
  get<T>(a: RecoilValue<T>): T;
  set<T>(s: RecoilState<T>, u: ((currVal: T) => T) | T): void;
  reset(s: RecoilState<any>): void;
}
export type CallbackInterface = Readonly<{
  set: <T>(recoilVal: RecoilState<T>, valOrUpdater: ((currVal: T) => T) | T) => void;
  reset: (recoilVal: RecoilState<any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  snapshot: Snapshot,
  gotoSnapshot: (snapshot: Snapshot) => void,
  transact_UNSTABLE: (cb: (i: TransactionInterface_UNSTABLE) => void) => void;
}>;

/**
 * Returns the value of an atom or selector (readonly or writeable) and
 * subscribes the components to future updates of that state.
 */
export function useRecoilValue<T>(recoilValue: RecoilValue<T>): T;

/**
 * Returns a Loadable representing the status of the given Recoil state
 * and subscribes the component to future updates of that state. Useful
 * for working with async selectors.
 */
export function useRecoilValueLoadable<T>(recoilValue: RecoilValue<T>): Loadable<T>;

/**
 * Returns a tuple where the first element is the value of the recoil state
 * and the second is a setter to update that state. Subscribes component
 * to updates of the given state.
 */
export function useRecoilState<T>(recoilState: RecoilState<T>): [T, SetterOrUpdater<T>];

/**
 * Returns a tuple where the first element is a Loadable and the second
 * element is a setter function to update the given state. Subscribes
 * component to updates of the given state.
 */
export function useRecoilStateLoadable<T>(recoilState: RecoilState<T>): [Loadable<T>, SetterOrUpdater<T>];

/**
 * Returns a setter function for updating Recoil state. Does not subscribe
 * the component to the given state.
 */

export function useSetRecoilState<T>(recoilState: RecoilState<T>): SetterOrUpdater<T>;

/**
 * Returns a function that will reset the given state to its default value.
 */
export function useResetRecoilState(recoilState: RecoilState<any>): Resetter; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Returns current info about an atom
 */
export function useGetRecoilValueInfo_UNSTABLE(): <T>(recoilValue: RecoilValue<T>) => AtomInfo<T>;

/**
 * Returns a function that will run the callback that was passed when
 * calling this hook. Useful for accessing Recoil state in response to
 * events.
 */
export function useRecoilCallback<Args extends ReadonlyArray<unknown>, Return>(
  fn: (interface: CallbackInterface) => (...args: Args) => Return,
  deps?: ReadonlyArray<unknown>,
): (...args: Args) => Return;

export function useRecoilTransaction_UNSTABLE<Args extends ReadonlyArray<unknown>>(
  fn: (interface: TransactionInterface_UNSTABLE) => (...args: Args) => void,
  deps?: ReadonlyArray<unknown>,
): (...args: Args) => void;

export function useRecoilTransactionObserver_UNSTABLE(
  callback: (opts: {
    snapshot: Snapshot,
    previousSnapshot: Snapshot,
  }) => void,
): void;

export function useGotoRecoilSnapshot(): (snapshot: Snapshot) => void;

export function useRecoilSnapshot(): Snapshot;

// useRecoilBridgeAcrossReactRoots.d.ts
export const RecoilBridge: React.FC;
export function useRecoilBridgeAcrossReactRoots_UNSTABLE(): typeof RecoilBridge;

// loadable.d.ts
declare const LoadablePromiseValue_OPAQUE: unique symbol;
interface LoadablePromiseValue {
  readonly [LoadablePromiseValue_OPAQUE]: true;
}
type LoadablePromise<T> = Promise<LoadablePromiseValue>;

interface BaseLoadable<T> {
  getValue: () => T;
  toPromise: () => Promise<T>;
  valueOrThrow: () => T;
  errorOrThrow: () => any;
  promiseOrThrow: () => Promise<T>;
  is: (other: Loadable<any>) => boolean;
  map: <S>(map: (from: T) => Promise<S> | S) => Loadable<S>;
}

interface ValueLoadable<T> extends BaseLoadable<T> {
  state: 'hasValue';
  contents: T;
  valueMaybe: () => T;
  errorMaybe: () => undefined;
  promiseMaybe: () => undefined;
}

interface LoadingLoadable<T> extends BaseLoadable<T> {
  state: 'loading';
  contents: LoadablePromise<T>;
  valueMaybe: () => undefined;
  errorMaybe: () => undefined;
  promiseMaybe: () => Promise<T>;
}

interface ErrorLoadable<T> extends BaseLoadable<T> {
  state: 'hasError';
  contents: any;
  valueMaybe: () => undefined;
  errorMaybe: () => any;
  promiseMaybe: () => undefined;
}

export type Loadable<T> =
  | ValueLoadable<T>
  | LoadingLoadable<T>
  | ErrorLoadable<T>;

// recoilValue.d.ts
declare class AbstractRecoilValue<T> {
  __tag: [T];
  __cTag: (t: T) => void; // for contravariance

  key: NodeKey;
  constructor(newKey: NodeKey);
}

declare class AbstractRecoilValueReadonly<T> {
  __tag: [T];

  key: NodeKey;
  constructor(newKey: NodeKey);
}

export class RecoilState<T> extends AbstractRecoilValue<T> {}
export class RecoilValueReadOnly<T> extends AbstractRecoilValueReadonly<T> {}
export type RecoilValue<T> = RecoilValueReadOnly<T> | RecoilState<T>;

export function isRecoilValue(val: unknown): val is RecoilValue<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Utilities */

// bigint not supported yet
type Primitive = undefined | null | boolean | number | symbol | string;

export type SerializableParam =
  | Primitive
  | {toJSON: () => string}
  | ReadonlyArray<SerializableParam>
  | Readonly<{[key: string]: SerializableParam}>;

export interface AtomFamilyOptions<T, P extends SerializableParam> {
  key: NodeKey;
  dangerouslyAllowMutability?: boolean;
  default: RecoilValue<T> | Promise<T> | T | ((param: P) => T | RecoilValue<T> | Promise<T>);
  effects_UNSTABLE?: | ReadonlyArray<AtomEffect<T>> | ((param: P) => ReadonlyArray<AtomEffect<T>>);
  // cachePolicyForParams_UNSTABLE?: CachePolicyWithoutEviction; TODO: removing while we discuss long term API
}

export function atomFamily<T, P extends SerializableParam>(
  options: AtomFamilyOptions<T, P>,
): (param: P) => RecoilState<T>;

export interface ReadOnlySelectorFamilyOptions<T, P extends SerializableParam> {
  key: string;
  get: (param: P) => (opts: {
    get: GetRecoilValue,
    getCallback: GetCallback,
  }) => Promise<T> | RecoilValue<T> | T;
  // cachePolicyForParams_UNSTABLE?: CachePolicyWithoutEviction; TODO: removing while we discuss long term API
  cachePolicy_UNSTABLE?: CachePolicyWithoutEquality; // TODO: using the more restrictive CachePolicyWithoutEquality while we discuss long term API
  dangerouslyAllowMutability?: boolean;
}

export interface ReadWriteSelectorFamilyOptions<T, P extends SerializableParam> {
  key: string;
  get: (param: P) => (opts: {
    get: GetRecoilValue,
    getCallback: GetCallback,
  }) => Promise<T> | RecoilValue<T> | T;
  set: (
      param: P,
  ) => (
      opts: { set: SetRecoilState; get: GetRecoilValue; reset: ResetRecoilState },
      newValue: T | DefaultValue,
  ) => void;
  // cachePolicyForParams_UNSTABLE?: CachePolicyWithoutEviction; TODO: removing while we discuss long term API
  cachePolicy_UNSTABLE?: CachePolicyWithoutEquality; // TODO: using the more restrictive CachePolicyWithoutEquality while we discuss long term API
  dangerouslyAllowMutability?: boolean;
}

export function selectorFamily<T, P extends SerializableParam>(
  options: ReadWriteSelectorFamilyOptions<T, P>,
): (param: P) => RecoilState<T>;

export function selectorFamily<T, P extends SerializableParam>(
  options: ReadOnlySelectorFamilyOptions<T, P>,
): (param: P) => RecoilValueReadOnly<T>;

export function constSelector<T extends SerializableParam>(constant: T): RecoilValueReadOnly<T>;

export function errorSelector(message: string): RecoilValueReadOnly<never>;

export function readOnlySelector<T>(atom: RecoilValue<T>): RecoilValueReadOnly<T>;

export function noWait<T>(state: RecoilValue<T>): RecoilValueReadOnly<Loadable<T>>;

/* eslint-disable @typescript-eslint/no-explicit-any */

export type UnwrapRecoilValue<T> = T extends RecoilValue<infer R> ? R : never;

export type UnwrapRecoilValues<T extends Array<RecoilValue<any>> | { [key: string]: RecoilValue<any> }> = {
  [P in keyof T]: UnwrapRecoilValue<T[P]>;
};
export type UnwrapRecoilValueLoadables<T extends Array<RecoilValue<any>> | { [key: string]: RecoilValue<any> }> = {
  [P in keyof T]: Loadable<UnwrapRecoilValue<T[P]>>;
};

export function waitForNone<RecoilValues extends Array<RecoilValue<any>> | [RecoilValue<any>]>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>>;

export function waitForNone<RecoilValues extends { [key: string]: RecoilValue<any> }>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>>;

export function waitForAny<RecoilValues extends Array<RecoilValue<any>> | [RecoilValue<any>]>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>>;

export function waitForAny<RecoilValues extends { [key: string]: RecoilValue<any> }>(
    param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>>;

export function waitForAll<RecoilValues extends Array<RecoilValue<any>> | [RecoilValue<any>]>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValues<RecoilValues>>;

export function waitForAll<RecoilValues extends { [key: string]: RecoilValue<any> }>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValues<RecoilValues>>;

export function waitForAllSettled<RecoilValues extends Array<RecoilValue<any>> | [RecoilValue<any>]>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>>;

export function waitForAllSettled<RecoilValues extends { [key: string]: RecoilValue<any> }>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>>;

/* eslint-enable @typescript-eslint/no-explicit-any */

export function snapshot_UNSTABLE(initializeState?: (shapshot: MutableSnapshot) => void): Snapshot;
