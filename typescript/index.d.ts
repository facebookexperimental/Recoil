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
export interface RecoilRootProps {
  initializeState?: (mutableSnapshot: MutableSnapshot) => void;
}

export const RecoilRoot: React.FC<RecoilRootProps>;

// Effect is called the first time a node is used with a <RecoilRoot>
export type AtomEffect<T, K extends NodeKey = NodeKey> = (param: {
  node: RecoilState<T, K>,
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
    param: (newValue: T | DefaultValue, oldValue: T | DefaultValue) => void,
  ) => void,
}) => void | (() => void);

// atom.d.ts
export interface AtomOptions<T, K extends NodeKey> {
  key: K;
  default: RecoilValue<T, K> | Promise<T> | T;
  effects_UNSTABLE?: ReadonlyArray<AtomEffect<T>>;
  dangerouslyAllowMutability?: boolean;
}

/**
 * Creates an atom, which represents a piece of writeable state
 */
export function atom<T, K extends NodeKey = NodeKey>(options: AtomOptions<T, K>): RecoilState<T, K>;

// selector.d.ts
export type GetRecoilValue = <T, K>(recoilVal: RecoilValue<T, K>) => T;

export type SetRecoilState = <T, K>(
    recoilVal: RecoilState<T, K>,
    newVal: T | DefaultValue | ((prevValue: T) => T | DefaultValue),
) => void;

export type ResetRecoilState = (recoilVal: RecoilState<any, any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface ReadOnlySelectorOptions<T, K extends NodeKey = NodeKey> {
    key: K;
    get: (opts: { get: GetRecoilValue }) => Promise<T> | RecoilValue<T, K> | T;
    dangerouslyAllowMutability?: boolean;
}

export interface ReadWriteSelectorOptions<T, K extends NodeKey> extends ReadOnlySelectorOptions<T, K> {
  set: (
    opts: {
      set: SetRecoilState;
      get: GetRecoilValue;
      reset: ResetRecoilState;
    },
    newValue: T | DefaultValue,
  ) => void;
}

export function selector<T, K extends NodeKey = NodeKey>(options: ReadWriteSelectorOptions<T, K>): RecoilState<T, K>;
export function selector<T, K extends NodeKey = NodeKey>(options: ReadOnlySelectorOptions<T, K>): RecoilValueReadOnly<T, K>;

// Snapshot.d.ts
declare const SnapshotID_OPAQUE: unique symbol;
export interface SnapshotID {
  readonly [SnapshotID_OPAQUE]: true;
}

export class Snapshot {
  getID(): SnapshotID;
  getLoadable<T, K extends NodeKey>(recoilValue: RecoilValue<T, K>): Loadable<T>;
  getPromise<T, K extends NodeKey>(recoilValue: RecoilValue<T, K>): Promise<T>;
  getNodes_UNSTABLE(opts?: { isModified?: boolean }): Iterable<RecoilValue<unknown, unknown>>;
  getInfo_UNSTABLE<T, K extends NodeKey>(recoilValue: RecoilValue<T, K>): {
    loadable?: Loadable<T>,
    isActive: boolean,
    isSet: boolean,
    isModified: boolean, // TODO report modified selectors
    type: 'atom' | 'selector' | undefined, // undefined until initialized for now
    deps: Iterable<RecoilValue<T, K>>,
    subscribers: {
      nodes: Iterable<RecoilValue<T, K>>,
    },
  };
  map(cb: (mutableSnapshot: MutableSnapshot) => void): Snapshot;
  asyncMap(cb: (mutableSnapshot: MutableSnapshot) => Promise<void>): Promise<Snapshot>;
}

export class MutableSnapshot extends Snapshot {
  set: SetRecoilState;
  reset: ResetRecoilState;
}

// hooks.d.ts
export type SetterOrUpdater<T> = (valOrUpdater: ((currVal: T) => T) | T) => void;
export type Resetter = () => void;
export type CallbackInterface = Readonly<{
  set: <T, K extends NodeKey>(recoilVal: RecoilState<T, K>, valOrUpdater: ((currVal: T) => T) | T) => void;
  reset: (recoilVal: RecoilState<any, any>) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  snapshot: Snapshot,
  gotoSnapshot: (snapshot: Snapshot) => void,
}>;

/**
 * Returns the value of an atom or selector (readonly or writeable) and
 * subscribes the components to future updates of that state.
 */
export function useRecoilValue<T, K extends NodeKey = NodeKey>(recoilValue: RecoilValue<T, K>): T;

/**
 * Returns a Loadable representing the status of the given Recoil state
 * and subscribes the component to future updates of that state. Useful
 * for working with async selectors.
 */
export function useRecoilValueLoadable<T, K extends NodeKey = NodeKey>(recoilValue: RecoilValue<T, K>): Loadable<T>;

/**
 * Returns a tuple where the first element is the value of the recoil state
 * and the second is a setter to update that state. Subscribes component
 * to updates of the given state.
 */
export function useRecoilState<T, K extends NodeKey = NodeKey>(recoilState: RecoilState<T, K>): [T, SetterOrUpdater<T>];

/**
 * Returns a tuple where the first element is a Loadable and the second
 * element is a setter function to update the given state. Subscribes
 * component to updates of the given state.
 */
export function useRecoilStateLoadable<T, K extends NodeKey = NodeKey>(recoilState: RecoilState<T, K>): [Loadable<T>, SetterOrUpdater<T>];

/**
 * Returns a setter function for updating Recoil state. Does not subscribe
 * the component to the given state.
 */

export function useSetRecoilState<T, K extends NodeKey = NodeKey>(recoilState: RecoilState<T, K>): SetterOrUpdater<T>;

/**
 * Returns a function that will reset the given state to its default value.
 */
export function useResetRecoilState(recoilState: RecoilState<any, any>): Resetter; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Returns a function that will run the callback that was passed when
 * calling this hook. Useful for accessing Recoil state in response to
 * events.
 */
export function useRecoilCallback<Args extends ReadonlyArray<unknown>, Return>(
  fn: (interface: CallbackInterface) => (...args: Args) => Return,
  deps?: ReadonlyArray<unknown>,
): (...args: Args) => Return;

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
  valueMaybe: () => T | void;
  valueOrThrow: () => T;
  errorMaybe: () => Error | void;
  errorOrThrow: () => Error;
  promiseMaybe: () => Promise<T> | void;
  promiseOrThrow: () => Promise<T>;
  map: <S>(map: (from: T) => Promise<S> | S) => Loadable<S>;
}

interface ValueLoadable<T> extends BaseLoadable<T> {
  state: 'hasValue';
  contents: T;
}

interface LoadingLoadable<T> extends BaseLoadable<T> {
  state: 'loading';
  contents: LoadablePromise<T>;
}

interface ErrorLoadable<T> extends BaseLoadable<T> {
  state: 'hasError';
  contents: Error;
}

export type Loadable<T> =
  | ValueLoadable<T>
  | LoadingLoadable<T>
  | ErrorLoadable<T>;

// recoilValue.d.ts
declare class AbstractRecoilValue<T, K = NodeKey> {
  __tag: [T];
  __cTag: (t: T) => void; // for contravariance

  key: K;
  constructor(newKey: K);
}

declare class AbstractRecoilValueReadonly<T, K = NodeKey> {
  __tag: [T];

  key: K;
  constructor(newKey: K);
}

export class RecoilState<T, K> extends AbstractRecoilValue<T, K> {}
export class RecoilValueReadOnly<T, K> extends AbstractRecoilValueReadonly<T, K> {}
export type RecoilValue<T, K> = RecoilValueReadOnly<T, K> | RecoilState<T, K>;

export function isRecoilValue(val: unknown): val is RecoilValue<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Utilities */

// bigint not supported yet
type Primitive = undefined | null | boolean | number | symbol | string;

export type SerializableParam = Primitive | ReadonlyArray<SerializableParam> | Readonly<{[key: string]: SerializableParam}>;

export interface AtomFamilyOptions<T, P extends SerializableParam, K extends NodeKey> {
  key: K;
  dangerouslyAllowMutability?: boolean;
  default: RecoilValue<T, K> | Promise<T> | T | ((param: P) => T | RecoilValue<T, K> | Promise<T>);
  effects_UNSTABLE?: | ReadonlyArray<AtomEffect<T>> | ((param: P) => ReadonlyArray<AtomEffect<T>>);
}

export function atomFamily<T, K extends NodeKey = NodeKey, P extends SerializableParam = SerializableParam>(
  options: AtomFamilyOptions<T, P, K>,
): (param: P) => RecoilState<T, K>;

export interface ReadOnlySelectorFamilyOptions<T, P extends SerializableParam, K extends NodeKey> {
  key: string;
  get: (param: P) => (opts: { get: GetRecoilValue }) => Promise<T> | RecoilValue<T, K> | T;
  // cacheImplementation_UNSTABLE?: () => CacheImplementation<Loadable<T>>,
  // cacheImplementationForParams_UNSTABLE?: () => CacheImplementation<
  //   RecoilValue<T>,
  // >,
  dangerouslyAllowMutability?: boolean;
}

export interface ReadWriteSelectorFamilyOptions<T, P extends SerializableParam, K extends NodeKey> {
  key: string;
  get: (param: P) => (opts: { get: GetRecoilValue }) => Promise<T> | RecoilValue<T, K> | T;
  set: (
      param: P,
  ) => (
      opts: { set: SetRecoilState; get: GetRecoilValue; reset: ResetRecoilState },
      newValue: T | DefaultValue,
  ) => void;
  // cacheImplementation_UNSTABLE?: () => CacheImplementation<Loadable<T>>,
  // cacheImplementationForParams_UNSTABLE?: () => CacheImplementation<
  //   RecoilValue<T>,
  // >,
  dangerouslyAllowMutability?: boolean;
}

export function selectorFamily<T, K extends NodeKey = NodeKey, P extends SerializableParam = SerializableParam>(
  options: ReadWriteSelectorFamilyOptions<T, P, K>,
): (param: P) => RecoilState<T, K>;

export function selectorFamily<T, K extends NodeKey = NodeKey, P extends SerializableParam = SerializableParam>(
  options: ReadOnlySelectorFamilyOptions<T, P, K>,
): (param: P) => RecoilValueReadOnly<T, K>;

export function constSelector<T extends SerializableParam, K extends NodeKey = NodeKey>(constant: T): RecoilValueReadOnly<T, K>;

export function errorSelector(message: string): RecoilValueReadOnly<never,never>;

export function readOnlySelector<T, K extends NodeKey = NodeKey>(atom: RecoilValue<T, K>): RecoilValueReadOnly<T, K>;

export function noWait<T, K extends NodeKey = NodeKey>(state: RecoilValue<T, K>): RecoilValueReadOnly<Loadable<T>, K>;

/* eslint-disable @typescript-eslint/no-explicit-any */

export type UnwrapRecoilValue<T, K extends NodeKey = NodeKey> = T extends RecoilValue<infer R, K> ? R : never;

export type UnwrapRecoilValues<T extends Array<RecoilValue<any,any>> | { [key: string]: RecoilValue<any,any> }> = {
  [P in keyof T]: UnwrapRecoilValue<T[P]>;
};
export type UnwrapRecoilValueLoadables<T extends Array<RecoilValue<any,any>> | { [key: string]: RecoilValue<any,any> }> = {
  [P in keyof T]: Loadable<UnwrapRecoilValue<T[P]>>;
};

export function waitForNone<RecoilValues extends Array<RecoilValue<any,any>> | [RecoilValue<any,any>], K extends NodeKey = NodeKey>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>, K>;

export function waitForNone<RecoilValues extends { [key: string]: RecoilValue<any,any> }, K extends NodeKey = NodeKey>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>, K>;

export function waitForAny<RecoilValues extends Array<RecoilValue<any,any>> | [RecoilValue<any,any>], K extends NodeKey = NodeKey>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>, K>;

export function waitForAny<RecoilValues extends { [key: string]: RecoilValue<any,any> }, K extends NodeKey = NodeKey>(
    param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValueLoadables<RecoilValues>, K>;

export function waitForAll<RecoilValues extends Array<RecoilValue<any,any>> | [RecoilValue<any,any>], K extends NodeKey = NodeKey>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValues<RecoilValues>, K>;

export function waitForAll<RecoilValues extends { [key: string]: RecoilValue<any,any> }, K extends NodeKey = NodeKey>(
  param: RecoilValues,
): RecoilValueReadOnly<UnwrapRecoilValues<RecoilValues>, K>;

/* eslint-enable @typescript-eslint/no-explicit-any */

export function snapshot_UNSTABLE(initializeState?: (shapshot: MutableSnapshot) => void): Snapshot;
