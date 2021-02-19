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
import type {
  Loadable,
  LoadablePromise,
  ResolvedLoadablePromiseInfo,
} from '../adt/Recoil_Loadable';
import type {DependencyMap} from '../core/Recoil_Graph';
import type {
  PersistenceInfo,
  ReadWriteNodeOptions,
  Trigger,
} from '../core/Recoil_Node';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {RetainedBy} from '../core/Recoil_RetainedBy';
import type {AtomWrites, NodeKey, Store, TreeState} from '../core/Recoil_State';

// @fb-only: const {scopedAtom} = require('Recoil_ScopedAtom');

const {
  loadableWithError,
  loadableWithPromise,
  loadableWithValue,
} = require('../adt/Recoil_Loadable');
const {
  DEFAULT_VALUE,
  DefaultValue,
  getConfigDeletionHandler,
  registerNode,
  setConfigDeletionHandler,
} = require('../core/Recoil_Node');
const {isRecoilValue} = require('../core/Recoil_RecoilValue');
const {
  markRecoilValueModified,
  setRecoilValue,
  setRecoilValueLoadable,
} = require('../core/Recoil_RecoilValueInterface');
const {retainedByOptionWithDefault} = require('../core/Recoil_Retention');
const deepFreezeValue = require('../util/Recoil_deepFreezeValue');
const expectationViolation = require('../util/Recoil_expectationViolation');
const isPromise = require('../util/Recoil_isPromise');
const nullthrows = require('../util/Recoil_nullthrows');
const recoverableViolation = require('../util/Recoil_recoverableViolation');
const selector = require('./Recoil_selector');

export type PersistenceSettings<Stored> = $ReadOnly<{
  ...PersistenceInfo,
  validator: (mixed, DefaultValue) => Stored | DefaultValue,
}>;

type NewValue<T> = T | DefaultValue | Promise<T | DefaultValue>;
type NewValueOrUpdater<T> =
  | T
  | DefaultValue
  | Promise<T | DefaultValue>
  | ((T | DefaultValue) => T | DefaultValue);

// Effect is called the first time a node is used with a <RecoilRoot>
export type AtomEffect<T> = ({
  node: RecoilState<T>,
  trigger: Trigger,

  // Call synchronously to initialize value or async to change it later
  setSelf: (
    | T
    | DefaultValue
    | Promise<T | DefaultValue>
    | ((T | DefaultValue) => T | DefaultValue),
  ) => void,
  resetSelf: () => void,

  // Subscribe callbacks to events.
  // Atom effect observers are called before global transaction observers
  onSet: (
    (newValue: T | DefaultValue, oldValue: T | DefaultValue) => void,
  ) => void,
}) => void | (() => void);

export type AtomOptions<T> = $ReadOnly<{
  key: NodeKey,
  default: RecoilValue<T> | Promise<T> | T,
  effects_UNSTABLE?: $ReadOnlyArray<AtomEffect<T>>,
  persistence_UNSTABLE?: PersistenceSettings<T>,
  // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS?: ScopeRules,
  dangerouslyAllowMutability?: boolean,
  retainedBy_UNSTABLE?: RetainedBy,
}>;

type BaseAtomOptions<T> = $ReadOnly<{
  ...AtomOptions<T>,
  default: T | Promise<T>,
}>;

function baseAtom<T>(options: BaseAtomOptions<T>): RecoilState<T> {
  const {key, persistence_UNSTABLE: persistence} = options;
  const retainedBy = retainedByOptionWithDefault(options.retainedBy_UNSTABLE);

  let liveStoresCount = 0;

  let defaultLoadable: Loadable<T> = isPromise(options.default)
    ? loadableWithPromise(
        options.default
          .then(value => {
            defaultLoadable = loadableWithValue(value);
            // TODO Temporary disable Flow due to pending selector_NEW refactor

            const promiseInfo: ResolvedLoadablePromiseInfo<T> = {
              __key: key,
              __value: value,
            };

            return promiseInfo;
          })
          .catch(error => {
            defaultLoadable = loadableWithError(error);
            throw error;
          }),
      )
    : loadableWithValue(options.default);

  let cachedAnswerForUnvalidatedValue:
    | void
    | [DependencyMap, Loadable<T>] = undefined;

  // Cleanup handlers for this atom
  // Rely on stable reference equality of the store to use it as a key per <RecoilRoot>
  const cleanupEffectsByStore: Map<Store, () => void> = new Map();

  function wrapPendingPromise(
    store: Store,
    promise: Promise<T | DefaultValue>,
  ): LoadablePromise<T | DefaultValue> {
    const wrappedPromise = promise
      .then(value => {
        const state = store.getState().nextTree ?? store.getState().currentTree;

        if (state.atomValues.get(key)?.contents === wrappedPromise) {
          setRecoilValue(store, node, value);
        }

        return {
          __key: key,
          __value: value,
        };
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
    trigger: Trigger,
  ): () => void {
    liveStoresCount++;
    const alreadyKnown = store.getState().knownAtoms.has(key);
    store.getState().knownAtoms.add(key);

    // Setup async defaults to notify subscribers when they resolve
    if (defaultLoadable.state === 'loading') {
      const notifyDefaultSubscribers = () => {
        const state = store.getState().nextTree ?? store.getState().currentTree;
        if (!state.atomValues.has(key)) {
          markRecoilValueModified(store, node);
        }
      };
      defaultLoadable.contents
        .then(notifyDefaultSubscribers)
        .catch(notifyDefaultSubscribers);
    }

    // Run Atom Effects

    // This state is scoped by Store, since this is in the initAtom() closure
    let initValue: NewValue<T> = DEFAULT_VALUE;
    let pendingSetSelf: ?{
      effect: AtomEffect<T>,
      value: T | DefaultValue,
    } = null;

    if (options.effects_UNSTABLE != null && !alreadyKnown) {
      let duringInit = true;

      const setSelf = (effect: AtomEffect<T>) => (
        valueOrUpdater: NewValueOrUpdater<T>,
      ) => {
        if (duringInit) {
          const currentValue: T | DefaultValue =
            initValue instanceof DefaultValue || isPromise(initValue)
              ? defaultLoadable.state === 'hasValue'
                ? defaultLoadable.contents
                : DEFAULT_VALUE
              : initValue;
          initValue =
            typeof valueOrUpdater === 'function'
              ? // cast to any because we can't restrict T from being a function without losing support for opaque types
                (valueOrUpdater: any)(currentValue) // flowlint-line unclear-type:off
              : valueOrUpdater;
        } else {
          if (isPromise(valueOrUpdater)) {
            throw new Error(
              'Setting atoms to async values is not implemented.',
            );
          }

          if (typeof valueOrUpdater !== 'function') {
            pendingSetSelf = {effect, value: valueOrUpdater};
          }

          setRecoilValue(
            store,
            node,
            typeof valueOrUpdater === 'function'
              ? currentValue => {
                  const newValue =
                    // cast to any because we can't restrict T from being a function without losing support for opaque types
                    (valueOrUpdater: any)(currentValue); // flowlint-line unclear-type:off
                  pendingSetSelf = {effect, value: newValue};
                  return newValue;
                }
              : valueOrUpdater,
          );
        }
      };
      const resetSelf = effect => () => setSelf(effect)(DEFAULT_VALUE);

      const onSet = effect => (
        handler: (T | DefaultValue, T | DefaultValue) => void,
      ) => {
        store.subscribeToTransactions(currentStore => {
          // eslint-disable-next-line prefer-const
          let {currentTree, previousTree} = currentStore.getState();
          if (!previousTree) {
            recoverableViolation(
              'Transaction subscribers notified without a next tree being present -- this is a bug in Recoil',
              'recoil',
            );
            previousTree = currentTree; // attempt to trundle on
          }
          const newLoadable = currentTree.atomValues.get(key);
          if (newLoadable == null || newLoadable.state === 'hasValue') {
            const newValue: T | DefaultValue =
              newLoadable != null ? newLoadable.contents : DEFAULT_VALUE;
            const oldLoadable =
              previousTree.atomValues.get(key) ?? defaultLoadable;
            const oldValue: T | DefaultValue =
              oldLoadable.state === 'hasValue'
                ? oldLoadable.contents
                : DEFAULT_VALUE; // TODO This isn't actually valid, use as a placeholder for now.

            // Ignore atom value changes that were set via setSelf() in the same effect.
            // We will still properly call the handler if there was a subsequent
            // set from something other than an atom effect which was batched
            // with the `setSelf()` call.  However, we may incorrectly ignore
            // the handler if the subsequent batched call happens to set the
            // atom to the exact same value as the `setSelf()`.   But, in that
            // case, it was kind of a noop, so the semantics are debatable..
            if (
              pendingSetSelf?.effect !== effect ||
              pendingSetSelf?.value !== newValue
            ) {
              handler(newValue, oldValue);
            }
          }
          if (pendingSetSelf?.effect === effect) {
            pendingSetSelf = null;
          }
        }, key);
      };

      for (const effect of options.effects_UNSTABLE ?? []) {
        const cleanup = effect({
          node,
          trigger,
          setSelf: setSelf(effect),
          resetSelf: resetSelf(effect),
          onSet: onSet(effect),
        });
        if (cleanup != null) {
          cleanupEffectsByStore.set(store, cleanup);
        }
      }

      duringInit = false;
    }

    // Mutate initial state in place since we know there are no other subscribers
    // since we are the ones initializing on first use.
    if (!(initValue instanceof DefaultValue)) {
      const initLoadable = isPromise(initValue)
        ? loadableWithPromise(wrapPendingPromise(store, initValue))
        : loadableWithValue(initValue);
      initState.atomValues.set(key, initLoadable);

      // If there is a pending transaction, then also mutate the next state tree.
      // This could happen if the atom was first initialized in an action that
      // also updated some other atom's state.
      store.getState().nextTree?.atomValues.set(key, initLoadable);
    }

    return () => {
      liveStoresCount--;
      cleanupEffectsByStore.get(store)?.();
      cleanupEffectsByStore.delete(store);
      store.getState().knownAtoms.delete(key); // FIXME remove knownAtoms?
    };
  }

  function peekAtom(_store, state: TreeState): ?Loadable<T> {
    return (
      state.atomValues.get(key) ??
      cachedAnswerForUnvalidatedValue?.[1] ??
      defaultLoadable
    );
  }

  function getAtom(
    _store: Store,
    state: TreeState,
  ): [DependencyMap, Loadable<T>] {
    if (state.atomValues.has(key)) {
      // Atom value is stored in state:
      return [new Map(), nullthrows(state.atomValues.get(key))];
    } else if (state.nonvalidatedAtoms.has(key)) {
      // Atom value is stored but needs validation before use.
      // We might have already validated it and have a cached validated value:
      if (cachedAnswerForUnvalidatedValue != null) {
        return cachedAnswerForUnvalidatedValue;
      }
      if (persistence == null) {
        expectationViolation(
          `Tried to restore a persisted value for atom ${key} but it has no persistence settings.`,
        );
        return [new Map(), defaultLoadable];
      }
      const nonvalidatedValue = state.nonvalidatedAtoms.get(key);
      const validatorResult: T | DefaultValue = persistence.validator(
        nonvalidatedValue,
        DEFAULT_VALUE,
      );

      const validatedValueLoadable =
        validatorResult instanceof DefaultValue
          ? defaultLoadable
          : loadableWithValue(validatorResult);
      cachedAnswerForUnvalidatedValue = [new Map(), validatedValueLoadable];
      return cachedAnswerForUnvalidatedValue;
    } else {
      return [new Map(), defaultLoadable];
    }
  }

  function invalidateAtom() {
    cachedAnswerForUnvalidatedValue = undefined;
  }

  function setAtom(
    _store: Store,
    state: TreeState,
    newValue: T | DefaultValue,
  ): [DependencyMap, AtomWrites] {
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

  function shouldDeleteConfigOnReleaseAtom() {
    return getConfigDeletionHandler(key) !== undefined && liveStoresCount <= 0;
  }

  const node = registerNode(
    ({
      key,
      peek: peekAtom,
      get: getAtom,
      set: setAtom,
      init: initAtom,
      invalidate: invalidateAtom,
      shouldDeleteConfigOnRelease: shouldDeleteConfigOnReleaseAtom,
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
      persistence_UNSTABLE: options.persistence_UNSTABLE
        ? {
            type: options.persistence_UNSTABLE.type,
            backButton: options.persistence_UNSTABLE.backButton,
          }
        : undefined,
      shouldRestoreFromSnapshots: true,
      retainedBy,
    }: ReadWriteNodeOptions<T>),
  );
  return node;
}

// prettier-ignore
function atom<T>(options: AtomOptions<T>): RecoilState<T> {
  const {
    default: optionsDefault,
    // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
    ...restOptions
  } = options;
  if (isRecoilValue(optionsDefault)
    // Continue to use atomWithFallback for promise defaults for scoped atoms
    // for now, since scoped atoms don't support async defaults
   // @fb-only: || (isPromise(optionsDefault) && scopeRules_APPEND_ONLY_READ_THE_DOCS)
  ) {
    return atomWithFallback<T>({
      ...restOptions,
      default: optionsDefault,
      // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS,
    });
  // @fb-only: } else if (scopeRules_APPEND_ONLY_READ_THE_DOCS && !isPromise(optionsDefault)) {
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

  const sel = selector<T>({
    key: `${options.key}__withFallback`,
    get: ({get}) => {
      const baseValue = get(base);
      return baseValue instanceof DefaultValue ? options.default : baseValue;
    },
    set: ({set}, newValue) => set(base, newValue),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  });
  setConfigDeletionHandler(sel.key, getConfigDeletionHandler(options.key));
  return sel;
}

module.exports = atom;
