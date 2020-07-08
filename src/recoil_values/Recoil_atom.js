/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Returns an atom, the basic unit of state in Recoil. An atom is a reference to
 * value that can be read, written, and subscribed to. It has a `key` that is
 * stable across time so that it can be persisted.
 *
 * There are two required options for creating an atom:
 *
 *    key. This is a string that uniquely identifies the atom. It should be
 *         stable across time so that persisted states remain valid.
 *
 *    default
 *          If `default` is provided, the atom is initialized to that value.
 *          Or, it may be set to another RecoilValue to use as a fallback.
 *          In that case, the value of the atom will be equal to that of the
 *          fallback, and will remain so until the first time the atom is written
 *          to, at which point it will stop tracking the fallback RecoilValue.
 *
 * The `persistence` option specifies that the atom should be saved to storage.
 * It is an object with two properties: `type` specifies where the atom should
 * be persisted; its only allowed value is "url"; `backButton` specifies whether
 * changes to the atom should result in pushes to the browser history stack; if
 * true, changing the atom and then hitting the Back button will cause the atom's
 * previous value to be restored. Applications are responsible for implementing
 * persistence by using the `useTransactionObservation` hook.
 *
 * Scoped atoms (DEPRECATED):
 * ===================================================================================
 *
 * The scopeRules_APPEND_ONLY_READ_THE_DOCS option causes the atom be be "scoped".
 * A scoped atom's value depends on other parts of the application state.
 * A separate value of the atom is stored for every value of the state that it
 * depends on. The dependencies may be changed without breaking existing URLs --
 * it uses whatever rule was current when the URL was written. Values written
 * under the newer rules are overlaid atop the previously-written values just for
 * those states in which the write occurred, with reads falling back to the older
 * values in other states, and eventually to the default or fallback.
 *
 * The scopedRules_APPEND_ONLY_READ_THE_DOCS parameter is a list of rules;
 * it should start with a single entry. This list must only be appended to:
 * existing entries must never be deleted or modified. Each rule is an atom
 * or selector whose value is some arbitrary key. A different value of the
 * scoped atom will be stored for each key. To change the scope rule, simply add
 * a new function to the list. Each rule is either an array of atoms of primitives,
 * or an atom of an array of primitives.
 *
 * Ordinary atoms may be upgraded to scoped atoms. To un-scope an atom, add a new
 * scope rule consisting of a constant.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

// @fb-only: import type {ScopeRules} from 'Recoil_ScopedAtom';
import type {Loadable} from '../adt/Recoil_Loadable';
import type {DependencyMap} from '../core/Recoil_Graph';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {AtomValues, NodeKey, Store, TreeState} from '../core/Recoil_State';

// @fb-only: const {scopedAtom} = require('Recoil_ScopedAtom');

const {
  loadableWithError,
  loadableWithPromise,
  loadableWithValue,
} = require('../adt/Recoil_Loadable');
const {
  DEFAULT_VALUE,
  DefaultValue,
  registerNode,
} = require('../core/Recoil_Node');
const {isRecoilValue} = require('../core/Recoil_RecoilValue');
const {
  setRecoilValue,
  setRecoilValueLoadable,
} = require('../core/Recoil_RecoilValueInterface');
const deepFreezeValue = require('../util/Recoil_deepFreezeValue');
const expectationViolation = require('../util/Recoil_expectationViolation');
const isPromise = require('../util/Recoil_isPromise');
const nullthrows = require('../util/Recoil_nullthrows');
const selector = require('./Recoil_selector');

// It would be nice if this didn't have to be defined at the Recoil level, but I don't want to make
// the api cumbersome. One way to do this would be to have a selector mark the atom as persisted.
// Note that this should also allow for special URL handling. (Although the persistence observer could
// have this as a separate configuration.)
export type PersistenceType = 'none' | 'url';
export type PersistenceInfo = $ReadOnly<{
  type: PersistenceType,
  backButton?: boolean,
}>;
export type PersistenceSettings<Stored> = $ReadOnly<{
  ...PersistenceInfo,
  validator: (mixed, DefaultValue) => Stored | DefaultValue,
}>;

// Effect is called the first time a node is used with a <RecoilRoot>
export type AtomEffect<T> = ({
  node: RecoilState<T>,
  trigger: 'set' | 'get',

  // Call synchronously to initialize value or async to change it later
  setSelf: (
    T | DefaultValue | Promise<T> | ((T | DefaultValue) => T | DefaultValue),
  ) => void,
  resetSelf: () => void,

  // Subscribe callbacks to events.
  // Atom effect observers are called before global transaction observers
  onSet: (
    (newValue: T | DefaultValue, oldValue: T | DefaultValue) => void,
  ) => void,
}) => void; // TODO Allow returning a cleanup function

export type AtomOptions<T> = $ReadOnly<{
  key: NodeKey,
  default: RecoilValue<T> | Promise<T> | T,
  effects_UNSTABLE?: $ReadOnlyArray<AtomEffect<T>>,
  persistence_UNSTABLE?: PersistenceSettings<T>,
  // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS?: ScopeRules,
  dangerouslyAllowMutability?: boolean,
}>;

type BaseAtomOptions<T> = $ReadOnly<{
  ...AtomOptions<T>,
  default: T,
}>;

function baseAtom<T>(options: BaseAtomOptions<T>): RecoilState<T> {
  const {key, persistence_UNSTABLE: persistence} = options;

  let cachedAnswerForUnvalidatedValue:
    | void
    | [DependencyMap, Loadable<T>] = undefined;

  function wrapPendingPromise(store: Store, promise: Promise<T>): Promise<T> {
    const wrappedPromise = promise
      .then(value => {
        const state = store.getState().nextTree ?? store.getState().currentTree;
        if (state.atomValues.get(key)?.contents === wrappedPromise) {
          setRecoilValue(store, node, value);
        }
        return value;
      })
      .catch(error => {
        const state = store.getState().nextTree ?? store.getState().currentTree;
        if (state.atomValues.get(key)?.contents === wrappedPromise) {
          setRecoilValueLoadable(store, node, loadableWithError(error));
        }
        throw error;
      });
    return wrappedPromise;
  }

  function initAtom(
    store: Store,
    initState: TreeState,
    trigger: 'set' | 'get',
  ) {
    if (store.getState().knownAtoms.has(key)) {
      return;
    }
    store.getState().knownAtoms.add(key);

    // Run Atom Effects
    let initValue: T | DefaultValue | Promise<T> = DEFAULT_VALUE;
    if (options.effects_UNSTABLE != null) {
      let duringInit = true;

      function setSelf(
        valueOrUpdater: T | DefaultValue | Promise<T> | (T => T | DefaultValue),
      ) {
        if (duringInit) {
          const currentValue: T =
            initValue instanceof DefaultValue || isPromise(initValue)
              ? options.default
              : initValue;
          initValue =
            typeof valueOrUpdater === 'function'
              ? // cast to any because we can't restrict type from being a function itself without losing support for opaque types
                // flowlint-next-line unclear-type:off
                (valueOrUpdater: any)(currentValue)
              : valueOrUpdater;
        } else {
          if (isPromise(valueOrUpdater)) {
            throw new Error(
              'Setting atoms to async values is not implemented.',
            );
          }
          setRecoilValue(store, node, valueOrUpdater);
        }
      }
      const resetSelf = () => setSelf(DEFAULT_VALUE);

      function onSet(handler: (T | DefaultValue, T | DefaultValue) => void) {
        store.subscribeToTransactions(currentStore => {
          const state = currentStore.getState();
          const nextState = state.nextTree ?? state.currentTree;
          const prevState = state.currentTree;
          const newLoadable = nextState.atomValues.get(key);
          if (newLoadable == null || newLoadable.state === 'hasValue') {
            const newValue: T | DefaultValue =
              newLoadable != null ? newLoadable.contents : DEFAULT_VALUE;
            const oldLoadable = prevState.atomValues.get(key);
            const oldValue: T | DefaultValue =
              oldLoadable == null
                ? options.default
                : oldLoadable.state === 'hasValue'
                ? oldLoadable.contents
                : DEFAULT_VALUE; // TODO This isn't actually valid, use as a placeholder for now.
            handler(newValue, oldValue);
          }
        }, key);
      }

      for (const effect of options.effects_UNSTABLE ?? []) {
        effect({node, trigger, setSelf, resetSelf, onSet});
      }

      duringInit = false;
    }

    // Mutate initial state in place since we know there are no other subscribers
    // since we are the ones initializing on first use.
    if (!(initValue instanceof DefaultValue)) {
      initState.atomValues.set(
        key,
        isPromise(initValue)
          ? // TODO Temp disable Flow due to pending selector_NEW refactor using LoadablePromise
            loadableWithPromise(
              (wrapPendingPromise(store, initValue): $FlowFixMe),
            )
          : loadableWithValue(initValue),
      );
    }
  }

  function myGet(store: Store, state: TreeState): [DependencyMap, Loadable<T>] {
    initAtom(store, state, 'get');

    if (state.atomValues.has(key)) {
      // Atom value is stored in state:
      return [new Map(), nullthrows(state.atomValues.get(key))];
    } else if (state.nonvalidatedAtoms.has(key)) {
      // Atom value is stored but needs validation before use.
      // We might have already validated it and have a cached validated value:
      if (cachedAnswerForUnvalidatedValue !== undefined) {
        return cachedAnswerForUnvalidatedValue;
      }
      if (persistence == null) {
        expectationViolation(
          `Tried to restore a persisted value for atom ${key} but it has no persistence settings.`,
        );
        return [new Map(), loadableWithValue(options.default)];
      }
      const nonvalidatedValue = state.nonvalidatedAtoms.get(key);
      const validatorResult: T | DefaultValue = persistence.validator(
        nonvalidatedValue,
        DEFAULT_VALUE,
      );

      const validatedValueLoadable = loadableWithValue(
        validatorResult instanceof DefaultValue
          ? options.default
          : validatorResult,
      );
      cachedAnswerForUnvalidatedValue = [new Map(), validatedValueLoadable];
      return cachedAnswerForUnvalidatedValue;
    } else {
      return [new Map(), loadableWithValue(options.default)];
    }
  }

  function invalidate() {
    cachedAnswerForUnvalidatedValue = undefined;
  }

  function mySet(
    store: Store,
    state: TreeState,
    newValue: T | DefaultValue,
  ): [DependencyMap, AtomValues] {
    initAtom(store, state, 'set');

    // Bail out if we're being set to the existing value, or if we're being
    // reset but have no stored value (validated or unvalidated) to reset from:
    if (state.atomValues.has(key)) {
      const existing = nullthrows(state.atomValues.get(key));
      if (existing.state === 'hasValue' && newValue === existing.contents) {
        return [new Map(), new Map()];
      }
    } else if (
      !state.nonvalidatedAtoms.has(key) &&
      newValue instanceof DefaultValue
    ) {
      return [new Map(), new Map()];
    }

    if (__DEV__) {
      if (options.dangerouslyAllowMutability !== true) {
        deepFreezeValue(newValue);
      }
    }

    cachedAnswerForUnvalidatedValue = undefined; // can be released now if it was previously in use
    return [new Map(), new Map().set(key, loadableWithValue(newValue))];
  }

  const node = registerNode({
    key,
    options,
    get: myGet,
    invalidate,
    set: mySet,
  });
  return node;
}

// prettier-ignore
function atom<T>(options: AtomOptions<T>): RecoilState<T> {
  const {
    default: optionsDefault,
    // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
    ...restOptions
  } = options;
  if (isRecoilValue(optionsDefault) || isPromise(optionsDefault)) {
    return atomWithFallback<T>({
      ...restOptions,
      default: optionsDefault,
      // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
    });
  // @fb-only: } else if (scopeRules_APPEND_ONLY_READ_THE_DOCS) {
    // @fb-only: return scopedAtom<T>({
      // @fb-only: ...restOptions,
      // @fb-only: default: optionsDefault,
      // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
    // @fb-only: });
  } else {
    return baseAtom<T>({...restOptions, default: optionsDefault});
  }
}

type AtomWithFallbackOptions<T> = $ReadOnly<{
  ...AtomOptions<T>,
  default: RecoilValue<T> | Promise<T>,
}>;

function atomWithFallback<T>(
  options: AtomWithFallbackOptions<T>,
): RecoilState<T> {
  const base = atom<T | DefaultValue>({
    ...options,
    default: DEFAULT_VALUE,
    persistence_UNSTABLE:
      options.persistence_UNSTABLE === undefined
        ? undefined
        : {
            ...options.persistence_UNSTABLE,
            validator: storedValue =>
              storedValue instanceof DefaultValue
                ? storedValue
                : nullthrows(options.persistence_UNSTABLE).validator(
                    storedValue,
                    DEFAULT_VALUE,
                  ),
          },
    // TODO Hack for now.
    // flowlint-next-line unclear-type: off
    effects_UNSTABLE: (options.effects_UNSTABLE: any),
  });

  return selector<T>({
    key: `${options.key}__withFallback`,
    get: ({get}) => {
      const baseValue = get(base);
      return baseValue instanceof DefaultValue ? options.default : baseValue;
    },
    set: ({set}, newValue) => set(base, newValue),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  });
}

module.exports = atom;
