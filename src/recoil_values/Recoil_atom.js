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
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {Snapshot} from '../core/Recoil_Snapshot';
import type {NodeKey, Store, TreeState} from '../core/Recoil_State';

// @fb-only: const {scopedAtom} = require('Recoil_ScopedAtom');

const {loadableWithValue} = require('../adt/Recoil_Loadable');
const {
  DEFAULT_VALUE,
  DefaultValue,
  registerNode,
} = require('../core/Recoil_Node');
const {isRecoilValue} = require('../core/Recoil_RecoilValue');
const {cloneSnapshot} = require('../core/Recoil_Snapshot');
const {
  mapByDeletingFromMap,
  mapBySettingInMap,
  setByAddingToSet,
} = require('../util/Recoil_CopyOnWrite');
const deepFreezeValue = require('../util/Recoil_deepFreezeValue');
const expectationViolation = require('../util/Recoil_expectationViolation');
const invariant = require('../util/Recoil_invariant');
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
type AtomEffect<T> = ({
  node: RecoilState<T>,
  trigger: 'set' | 'get',

  // Call synchronously to initialize value or async to change it later
  setSelf: (
    T | DefaultValue | ((T | DefaultValue) => T | DefaultValue),
  ) => void,
  resetSelf: () => void,
  getSnapshot: () => Snapshot,

  // Subscribe callbacks to events.
  // Atom effect observers are called before global transaction observers
  onSet: ((newValue: T | DefaultValue) => void) => void,
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

  function initAtom(
    store: Store,
    initState: TreeState,
    trigger: 'set' | 'get',
  ): TreeState {
    if (initState.knownAtoms.has(key)) {
      return initState;
    }

    // Run Atom Effects
    let initValue: T | DefaultValue = DEFAULT_VALUE;
    if (options.effects_UNSTABLE != null) {
      let duringInit = true;

      function getSnapshot() {
        return cloneSnapshot(
          duringInit
            ? initState
            : store.getState().nextTree ?? store.getState().currentTree,
        );
      }

      function setSelf(
        valueOrUpdater: T | DefaultValue | (T => T | DefaultValue),
      ) {
        if (duringInit) {
          const currentValue: T =
            initValue instanceof DefaultValue ? options.default : initValue;
          initValue =
            typeof valueOrUpdater === 'function'
              ? // cast to any because we can't restrict type from being a function itself without losing support for opaque types
                // flowlint-next-line unclear-type:off
                (valueOrUpdater: any)(currentValue)
              : valueOrUpdater;
        } else {
          store.replaceState(asyncState => {
            let newState = asyncState;
            const newValue: T | DefaultValue =
              typeof valueOrUpdater !== 'function'
                ? valueOrUpdater
                : (() => {
                    const [_, loadable] = myGet(store, asyncState);
                    invariant(
                      loadable.state === 'hasValue',
                      "Recoil doesn't support async Atoms yet",
                    );
                    // cast to any because we can't restrict type from being a function itself without losing support for opaque types
                    // flowlint-next-line unclear-type:off
                    return (valueOrUpdater: any)(loadable.contents);
                  })();
            const [nextState, writtenNodes] = mySet(
              store,
              asyncState,
              newValue,
            );
            newState = nextState;
            store.fireNodeSubscriptions(writtenNodes, 'enqueue');
            return newState;
          });
        }
      }
      const resetSelf = () => setSelf(DEFAULT_VALUE);

      function onSet(handler: (T | DefaultValue) => void) {
        store.subscribeToTransactions(asyncStore => {
          const nextState =
            asyncStore.getState().nextTree ?? asyncStore.getState().currentTree;
          const {atomValues} = nextState;
          const newValue: T | DefaultValue = atomValues.has(key)
            ? nullthrows(atomValues.get(key)).valueOrThrow()
            : DEFAULT_VALUE;
          handler(newValue);
        }, key);
      }

      for (const effect of options.effects_UNSTABLE ?? []) {
        effect({node, trigger, setSelf, resetSelf, getSnapshot, onSet});
      }

      duringInit = false;
    }

    return {
      ...initState,
      knownAtoms: setByAddingToSet(initState.knownAtoms, key),
      atomValues: !(initValue instanceof DefaultValue)
        ? mapBySettingInMap(
            initState.atomValues,
            key,
            loadableWithValue(initValue),
          )
        : initState.atomValues,
    };
  }

  function myGet(store: Store, initState: TreeState): [TreeState, Loadable<T>] {
    const state = initAtom(store, initState, 'get');

    if (state.atomValues.has(key)) {
      // atom value is stored in state
      return [state, nullthrows(state.atomValues.get(key))];
    } else if (state.nonvalidatedAtoms.has(key)) {
      if (persistence == null) {
        expectationViolation(
          `Tried to restore a persisted value for atom ${key} but it has no persistence settings.`,
        );
        return [state, loadableWithValue(options.default)];
      }
      const nonvalidatedValue = state.nonvalidatedAtoms.get(key);
      const validatedValue: T | DefaultValue = persistence.validator(
        nonvalidatedValue,
        DEFAULT_VALUE,
      );

      return validatedValue instanceof DefaultValue
        ? [
            {
              ...state,
              nonvalidatedAtoms: mapByDeletingFromMap(
                state.nonvalidatedAtoms,
                key,
              ),
            },
            loadableWithValue(options.default),
          ]
        : [
            {
              ...state,
              atomValues: mapBySettingInMap(
                state.atomValues,
                key,
                loadableWithValue(validatedValue),
              ),
              nonvalidatedAtoms: mapByDeletingFromMap(
                state.nonvalidatedAtoms,
                key,
              ),
            },
            loadableWithValue(validatedValue),
          ];
    } else {
      return [state, loadableWithValue(options.default)];
    }
  }

  function mySet(
    store: Store,
    initState: TreeState,
    newValue: T | DefaultValue,
  ): [TreeState, $ReadOnlySet<NodeKey>] {
    const state = initAtom(store, initState, 'set');

    if (options.dangerouslyAllowMutability !== true) {
      deepFreezeValue(newValue);
    }
    return [
      {
        ...state,
        dirtyAtoms: setByAddingToSet(state.dirtyAtoms, key),
        atomValues:
          newValue instanceof DefaultValue
            ? mapByDeletingFromMap(state.atomValues, key)
            : mapBySettingInMap(
                state.atomValues,
                key,
                loadableWithValue(newValue),
              ),
        nonvalidatedAtoms: mapByDeletingFromMap(state.nonvalidatedAtoms, key),
      },
      new Set([key]),
    ];
  }

  const node = registerNode({
    key,
    options,
    get: myGet,
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
