/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {AtomOptions, PersistenceSettings} from './Recoil_atom';
import type {CacheImplementation} from '../caches/Recoil_Cache';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
// @fb-only: import type {ScopeRules} from './Recoil_ScopedAtom';

const atom = require('./Recoil_atom');
const cacheWithValueEquality = require('../caches/Recoil_cacheWithValueEquality');
const {DEFAULT_VALUE, DefaultValue} = require('../core/Recoil_Node');
const ParameterizedAtomTaggedValue_DEPRECATED = require('../adt/Recoil_ParameterizedAtomTaggedValue_DEPRECATED');
// @fb-only: const {parameterizedScopedAtomLegacy} = require('./Recoil_ScopedAtom');
const selectorFamily = require('./Recoil_selectorFamily');
const stableStringify = require('../util/Recoil_stableStringify');

const everySet = require('../util/Recoil_everySet');

type Primitive = void | null | boolean | number | string;
export type Parameter =
  | Primitive
  | $ReadOnlyArray<Parameter>
  | $ReadOnly<{[string]: Parameter, ...}>;

// flowlint unclear-type:off
export type ParameterizedScopeRules<P> = $ReadOnlyArray<
  | RecoilValue<$ReadOnlyArray<any>>
  | $ReadOnlyArray<RecoilValue<any> | (P => RecoilValue<any>)>,
>;
// flowlint unclear-type:error

export type AtomFamilyOptions<T, P: Parameter> = $ReadOnly<{
  ...AtomOptions<T>,
  default:
    | RecoilValue<T>
    | Promise<T>
    | T
    | (P => T | RecoilValue<T> | Promise<T>),
  scopeRules_APPEND_ONLY_READ_THE_DOCS?: ParameterizedScopeRules<P>,
}>;

// TODO Drop support for ParameterizedAtomTaggedValue_DEPRECATED June 2020
type StoredBaseValue_DEPRECATED<T> =
  | ParameterizedAtomTaggedValue_DEPRECATED<T | DefaultValue>
  | T;

function isSuperset(setA, setB) {
  return everySet(setB, b => setA.has(b));
}

const pick = (
  object: {+[string]: mixed, ...},
  chosenKeys: Set<string>,
): {+[string]: mixed, ...} =>
  Array.from(chosenKeys).reduce(
    (obj, key) => ({...obj, [key]: object[key]}),
    {},
  );

function getParameterizedValue_DEPRECATED<T, P: Parameter>(
  baseValue: StoredBaseValue_DEPRECATED<T>,
  parameter: P,
): T | DefaultValue {
  // Allow simple atoms to be upgraded to atomFamilies
  if (!(baseValue instanceof ParameterizedAtomTaggedValue_DEPRECATED)) {
    return baseValue;
  }

  // Legacy ParameterizedAtomTaggedValue only supported object type parameters
  if (
    typeof parameter !== 'object' ||
    parameter == null ||
    Array.isArray(parameter)
  ) {
    return DEFAULT_VALUE;
  }

  const entries = baseValue.value;
  const parameterKeys = new Set(Object.keys(parameter));
  for (const [entryParameterKeys, entryMap] of entries) {
    if (isSuperset(parameterKeys, entryParameterKeys)) {
      const contextOrSubcontext =
        parameterKeys.size === entryParameterKeys.size // if true they are equal
          ? parameter
          : pick(parameter, entryParameterKeys);
      const value = entryMap.get(stableStringify(contextOrSubcontext));
      if (value !== undefined) {
        return value;
      }
    }
  }
  return DEFAULT_VALUE;
}

function mapPersistenceSettings_DEPRECATED<T>(
  settings?: PersistenceSettings<T>,
): PersistenceSettings<StoredBaseValue_DEPRECATED<T>> | void {
  if (settings == null) {
    return undefined;
  }
  const {...passthrough} = settings;
  return {
    ...passthrough,
    validator: storedValue => {
      if (storedValue instanceof ParameterizedAtomTaggedValue_DEPRECATED) {
        return new ParameterizedAtomTaggedValue_DEPRECATED(
          storedValue.value
            .filter(([keys, map]) => keys instanceof Set && map instanceof Map)
            .map(([keys, map]) => [
              keys,
              Array.from(map.entries()).reduce((acc, [k, v]) => {
                const validatedValue = passthrough.validator(v, DEFAULT_VALUE);
                if (validatedValue instanceof DefaultValue) {
                  return acc;
                }
                acc.set(k, validatedValue);
                return acc;
              }, new Map()),
            ]),
        );
      } else {
        return passthrough.validator(storedValue, DEFAULT_VALUE);
      }
    },
  };
}

// Process scopeRules to handle any entries which are functions taking parameters
function mapScopeRules<P>(
  scopeRules?: ParameterizedScopeRules<P>,
  param: P,
): ScopeRules | void {
  return scopeRules?.map(rule =>
    Array.isArray(rule)
      ? rule.map(entry => (typeof entry === 'function' ? entry(param) : entry))
      : rule,
  );
}

/*
A function which returns an atom based on the input parameter.

Each unique parameter returns a unique atom. E.g.,

  const f = atomFamily(...);
  f({a: 1}) => an atom
  f({a: 2}) => a different atom

This allows components to persist local, private state using atoms.  Each
instance of the component may have a different key, which it uses as the
parameter for a family of atoms; in this way, each component will have
its own atom not shared by other instances.  These state keys may be composed
into children's state keys as well.
*/
function atomFamily<T, P: Parameter>(
  options: AtomFamilyOptions<T, P>,
): P => RecoilState<T> {
  let atomCache: CacheImplementation<RecoilState<T>> = cacheWithValueEquality();

  // An atom to represent any legacy atoms that we can upgrade to an atomFamily
  const legacyAtomOptions = {
    key: options.key, // Legacy atoms just used the plain key directly
    default: DEFAULT_VALUE,
    // TODO Drop support for ParameterizedAtomTaggedValue_DEPRECATED June 2020
    persistence_UNSTABLE: mapPersistenceSettings_DEPRECATED(
      options.persistence_UNSTABLE,
    ),
  };
  let legacyAtom;
// @fb-only:   if(
// @fb-only:     options.scopeRules_APPEND_ONLY_READ_THE_DOCS
// @fb-only:   ) {
// @fb-only:   legacyAtom = parameterizedScopedAtomLegacy<
// @fb-only:     StoredBaseValue_DEPRECATED<T> | DefaultValue,
// @fb-only:     P>({
// @fb-only:     ...legacyAtomOptions,
// @fb-only:     scopeRules_APPEND_ONLY_READ_THE_DOCS:
// @fb-only:     options.scopeRules_APPEND_ONLY_READ_THE_DOCS,
// @fb-only:   });
// @fb-only:   } else {
    legacyAtom = atom<StoredBaseValue_DEPRECATED<T> | DefaultValue>(legacyAtomOptions);;
// @fb-only:   }

  // Selector to calculate the default value based on any persisted legacy atoms
  // that were upgraded to a atomFamily
  const atomFamilyDefault = selectorFamily<T, P>({
    key: `${options.key}__atomFamily/Default`,
    get: param => ({get}) => {
      const legacyValue = get(
        typeof legacyAtom === 'function' ? legacyAtom(param) : legacyAtom,
      );

      if (!(legacyValue instanceof DefaultValue)) {
        // Atom was upgraded from a non-parameterized atom
        // or a legacy ParameterizedAtomTaggedValue
        // TODO Drop support for ParameterizedAtomTaggedValue_DEPRECATED June 2020
        const upgradedValue = getParameterizedValue_DEPRECATED(
          legacyValue,
          param,
        );
        if (!(upgradedValue instanceof DefaultValue)) {
          return upgradedValue;
        }
      }

      // There's no legacy atom value, so use the user-specified default
      return typeof options.default === 'function'
        ? // The default was parameterized
          // Flow doesn't know that T isn't a function, so we need to case to any
          (options.default: any)(param) // flowlint-line unclear-type:off
        : // Default may be a static value, promise, or RecoilValue
          options.default;
    },
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  });

  // Simple atomFamily implementation to cache individual atoms based
  // on the parameter value equality.
  return (params: P) => {
    const cachedAtom = atomCache.get(params);
    if (cachedAtom != null) {
      return cachedAtom;
    }

    const newAtom = atom<T>({
      key: `${options.key}__${stableStringify(params) ?? 'void'}`,
      default: atomFamilyDefault(params),
      scopeRules_APPEND_ONLY_READ_THE_DOCS: mapScopeRules(
        options.scopeRules_APPEND_ONLY_READ_THE_DOCS,
        params,
      ),
      persistence_UNSTABLE: options.persistence_UNSTABLE,
      dangerouslyAllowMutability: options.dangerouslyAllowMutability,
    });

    atomCache = atomCache.set(params, newAtom);
    return newAtom;
  };
}

module.exports = atomFamily;
