/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * A scoped atom's value depends on other parts of the application state.
 * A separate value of the atom is stored for every value of the state that it
 * depends on. The dependencies may be changed without breaking existing URLs --
 * it uses whatever rule was current when the URL was written. Values written
 * under the newer rules are overlaid atop the previously-written values just for
 * those states in which the write occurred, with reads falling back to the older
 * values in other states, and eventually to a fallback.
 *
 * The scopedRules_APPEND_ONLY_READ_THE_DOCS parameter is a list of rules;
 * it should start with a single entry. This list must only be appended to:
 * existing entries must never be deleted or modified. Each rule is an atom
 * or selector whose value is some arbitrary key. A different value of the
 * scoped atom will be stored for each key. To change the scope rule, simply add
 * a new function to the list.
 *
 * Ordinary atoms may be upgraded to scoped atoms. To un-scope an atom, add a new
 * scope rule consisting of a constant.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {AtomOptions, PersistenceSettings} from 'Recoil_atom';
import type {Parameter, ParameterizedScopeRules} from 'Recoil_atomFamily';
import type {RecoilState, RecoilValue} from 'Recoil_RecoilValue';
import type {ScopedValue, ScopeMap} from 'Recoil_ScopedAtomTaggedValue';

const ArrayKeyedMap = require('../adt/Recoil_ArrayKeyedMap');
const ScopedAtomTaggedValue = require('../adt/Recoil_ScopedAtomTaggedValue');
const {DEFAULT_VALUE, DefaultValue} = require('../core/Recoil_Node');
const mapIterable = require('../util/Recoil_mapIterable');
const stableStringify = require('../util/Recoil_stableStringify');
const atom = require('./Recoil_atom');
const selector = require('./Recoil_selector');
const selectorFamily = require('./Recoil_selectorFamily');
const {waitForAll} = require('./Recoil_WaitFor');

type Primitive = number | string | boolean | null | void;

type StoredBaseValue<T> = ScopedAtomTaggedValue<T | DefaultValue> | T;

function cloneEntries<T>(
  entries: ScopedValue<T>,
): Array<[number, ScopeMap<T>]> {
  return entries.map(([i, map]) => [i, new ArrayKeyedMap(map)]);
}

function computeRuleLabel(
  scopeKey: $ReadOnlyArray<mixed>,
): $ReadOnlyArray<Primitive> {
  return scopeKey.map(value =>
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value == null
      ? value
      : stableStringify(value),
  );
}

// flowlint unclear-type:off
export type ScopeRules = $ReadOnlyArray<
  RecoilValue<$ReadOnlyArray<any>> | $ReadOnlyArray<RecoilValue<any>>,
>;
// flowlint unclear-type:error

function getCurrentValue<T>(
  defaultValue: T,
  baseValue: StoredBaseValue<T>,
  scopeRuleValues: $ReadOnlyArray<$ReadOnlyArray<mixed>>,
): T {
  if (!(baseValue instanceof ScopedAtomTaggedValue)) {
    // Fall back to raw value as this is an atom that was upgraded from
    // non-scoped to scoped:
    return baseValue;
  }
  // Use the first scope rule with a recorded state whose scope obtains:
  for (const [ruleIndex, map] of baseValue.entries) {
    const value = map.get(computeRuleLabel(scopeRuleValues[ruleIndex]));
    if (value !== undefined) {
      return value instanceof DefaultValue ? defaultValue : value;
    }
  }
  return defaultValue;
}

// Update the baseValue with the new value set.
// If setting to a DefaultValue it will actually write that placeholder instead
// of deleting from the ParameterizedAtomTaggedValue.  This is to properly support
// chaining of backward compatibility.
function baseValueByWritingToBaseValue<T>(
  newValue: T | DefaultValue,
  baseValue: StoredBaseValue<T>,
  scopeRuleValues,
): ScopedAtomTaggedValue<T | DefaultValue> {
  const entries =
    baseValue instanceof ScopedAtomTaggedValue ? baseValue.entries : [];
  const latestRuleIndex = scopeRuleValues.length - 1;
  const latestRuleValue = computeRuleLabel(scopeRuleValues[latestRuleIndex]);
  const newEntries = cloneEntries(entries);
  if (entries.length > 0 && entries[0][0] === latestRuleIndex) {
    // Current value was saved under latest rule; update that rule's map:
    newEntries[0][1].set(latestRuleValue, newValue);
  } else {
    // Value was saved under old rule; add new entry with latest rule:
    newEntries.unshift([
      latestRuleIndex,
      new ArrayKeyedMap().set(latestRuleValue, newValue),
    ]);
  }
  return new ScopedAtomTaggedValue(newEntries);
}

function mapPersistenceSettings<T>(
  settings: ?PersistenceSettings<T>,
  atomDefault: T,
): PersistenceSettings<StoredBaseValue<T>> | void {
  if (settings === null || settings === undefined) {
    return undefined;
  }
  const nonNullSettings: PersistenceSettings<T> = settings; // WTF flow?
  return {
    ...settings,
    validator: storedValue => {
      if (storedValue instanceof ScopedAtomTaggedValue) {
        return new ScopedAtomTaggedValue(
          storedValue.entries
            .filter(
              ([i, map]) =>
                typeof i === 'number' && map instanceof ArrayKeyedMap,
            )
            .map(([i, map]) => [
              i,
              new ArrayKeyedMap(
                mapIterable(map.entries(), ([k, v]) => {
                  const validatedValue = nonNullSettings.validator(
                    v,
                    DEFAULT_VALUE,
                  );
                  return [
                    k,
                    validatedValue instanceof DefaultValue
                      ? atomDefault
                      : validatedValue,
                  ];
                }),
              ),
            ]),
        );
      } else {
        return nonNullSettings.validator(storedValue, DEFAULT_VALUE);
      }
    },
  };
}

function scopedAtom<T>(
  options: $ReadOnly<{
    ...AtomOptions<T>,
    default: T,
    scopeRules_APPEND_ONLY_READ_THE_DOCS: ScopeRules,
  }>,
): RecoilState<T> {
  // Normalize the scope rules to an array of RecoilValues of an array of scope keys.
  const scopeRules: $ReadOnlyArray<
    RecoilValue<$ReadOnlyArray<mixed>>,
  > = options.scopeRules_APPEND_ONLY_READ_THE_DOCS.map(rule =>
    Array.isArray(rule) ? waitForAll(rule) : rule,
  );

  const base = atom<ScopedAtomTaggedValue<T | DefaultValue> | T>({
    key: options.key,
    default: new ScopedAtomTaggedValue<T | DefaultValue>([]),
    persistence_UNSTABLE: mapPersistenceSettings<T>(
      options.persistence_UNSTABLE,
      options.default,
    ),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  });

  return selector<T>({
    key: `${options.key}__scopedAtom`,
    get: ({get}) =>
      getCurrentValue<T>(
        options.default,
        get(base),
        // TODO Only get the rules that we actually need to compute the value
        get(waitForAll(scopeRules)),
      ),
    set: ({set, get}, newValue) =>
      set(base, oldValue =>
        baseValueByWritingToBaseValue(
          newValue,
          oldValue,
          get(waitForAll(scopeRules)),
        ),
      ),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  });
}

function normalizeParameterizedScopeRules<P: Parameter>(
  scopeRules: ParameterizedScopeRules<P>,
): $ReadOnlyArray<(P) => RecoilValue<$ReadOnlyArray<mixed>>> {
  return scopeRules.map(rule =>
    Array.isArray(rule)
      ? // create a selector that combines the atom values into an array and forwards any params:
        param =>
          waitForAll(
            rule.map(entry =>
              typeof entry === 'function' ? entry(param) : entry,
            ),
          )
      : () => rule,
  );
}

// This atom is only needed to represent the legacy persisted value of an atom
// that was upgraded to a parameterized and scoped atom in case one of the
// scope rules contains a parameterized callback entry.
function parameterizedScopedAtomLegacy<T, P: Parameter>(
  options: $ReadOnly<{
    ...AtomOptions<T>,
    default: T,
    scopeRules_APPEND_ONLY_READ_THE_DOCS: ParameterizedScopeRules<P>,
  }>,
): P => RecoilState<T> {
  const scopeRules = normalizeParameterizedScopeRules(
    options.scopeRules_APPEND_ONLY_READ_THE_DOCS,
  );
  const base = atom<ScopedAtomTaggedValue<T | DefaultValue> | T>({
    key: options.key,
    default: new ScopedAtomTaggedValue<T | DefaultValue>([]),
    persistence_UNSTABLE: mapPersistenceSettings<T>(
      options.persistence_UNSTABLE,
      options.default,
    ),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  });

  return selectorFamily<T, P>({
    key: `${options.key}__scopedAtom`,
    get: params => ({get}) =>
      getCurrentValue<T>(
        options.default,
        get(base),
        // TODO Only get the rules that we actually need to compute the value
        get(waitForAll(scopeRules.map(rule => rule(params)))),
      ),
    set: params => ({set, get}, newValue) =>
      set(base, oldValue =>
        baseValueByWritingToBaseValue(
          newValue,
          oldValue,
          get(waitForAll(scopeRules.map(rule => rule(params)))),
        ),
      ),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  });
}

module.exports = {scopedAtom, parameterizedScopedAtomLegacy};
