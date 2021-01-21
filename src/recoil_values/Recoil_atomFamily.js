/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

// @fb-only: import type {ScopeRules} from 'Recoil_ScopedAtom';
import type {CacheImplementation} from '../caches/Recoil_Cache';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';
import type {RetainedBy} from '../core/Recoil_RetainedBy';
import type {AtomEffect, AtomOptions} from './Recoil_atom';

// @fb-only: const {parameterizedScopedAtomLegacy} = require('Recoil_ScopedAtom');

const cacheWithValueEquality = require('../caches/Recoil_cacheWithValueEquality');
const {
  DEFAULT_VALUE,
  DefaultValue,
  setConfigDeletionHandler,
} = require('../core/Recoil_Node');
const stableStringify = require('../util/Recoil_stableStringify');
const atom = require('./Recoil_atom');
const selectorFamily = require('./Recoil_selectorFamily');

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
  effects_UNSTABLE?:
    | $ReadOnlyArray<AtomEffect<T>>
    | (P => $ReadOnlyArray<AtomEffect<T>>),
  retainedBy_UNSTABLE?: RetainedBy | (P => RetainedBy),

  // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS?: ParameterizedScopeRules<P>,
}>;

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
    persistence_UNSTABLE: options.persistence_UNSTABLE,
  };
  let legacyAtom;
  // prettier-ignore
  // @fb-only: if (
  // @fb-only: options.scopeRules_APPEND_ONLY_READ_THE_DOCS
  // @fb-only: ) {
  // @fb-only: legacyAtom = parameterizedScopedAtomLegacy<T | DefaultValue, P>({
  // @fb-only: ...legacyAtomOptions,
  // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS:
  // @fb-only: options.scopeRules_APPEND_ONLY_READ_THE_DOCS,
  // @fb-only: });
  // @fb-only: } else {
  legacyAtom = atom<T | DefaultValue>(legacyAtomOptions);
  // @fb-only: }

  // Selector to calculate the default value based on any persisted legacy atoms
  // that were upgraded to a atomFamily
  const atomFamilyDefault = selectorFamily<T, P>({
    key: `${options.key}__atomFamily/Default`,
    get: param => ({get}) => {
      const legacyValue = get(
        typeof legacyAtom === 'function' ? legacyAtom(param) : legacyAtom,
      );

      // Atom was upgraded from a non-parameterized atom
      if (!(legacyValue instanceof DefaultValue)) {
        return legacyValue;
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
    retainedBy_UNSTABLE: options.retainedBy_UNSTABLE,
  });

  // Simple atomFamily implementation to cache individual atoms based
  // on the parameter value equality.
  return (params: P) => {
    const cachedAtom = atomCache.get(params);
    if (cachedAtom != null) {
      return cachedAtom;
    }

    const newAtom = atom<T>({
      ...options,
      key: `${options.key}__${stableStringify(params) ?? 'void'}`,
      default: atomFamilyDefault(params),

      retainedBy_UNSTABLE:
        typeof options.retainedBy_UNSTABLE === 'function'
          ? options.retainedBy_UNSTABLE(params)
          : options.retainedBy_UNSTABLE,

      effects_UNSTABLE:
        typeof options.effects_UNSTABLE === 'function'
          ? options.effects_UNSTABLE(params)
          : options.effects_UNSTABLE,

      // prettier-ignore
      // @fb-only: scopeRules_APPEND_ONLY_READ_THE_DOCS: mapScopeRules(
      // @fb-only: options.scopeRules_APPEND_ONLY_READ_THE_DOCS,
      // @fb-only: params,
      // @fb-only: ),
    });

    atomCache = atomCache.set(params, newAtom);
    setConfigDeletionHandler(newAtom.key, () => {
      atomCache = atomCache.delete(params);
    });

    return newAtom;
  };
}

module.exports = atomFamily;
