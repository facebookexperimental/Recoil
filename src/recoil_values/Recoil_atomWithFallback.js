/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {AtomOptions} from 'Recoil_atom';
import type {RecoilState, RecoilValue} from 'Recoil_RecoilValue';

const atom = require('Recoil_atom');
const {DEFAULT_VALUE, DefaultValue} = require('Recoil_Node');
const selector = require('Recoil_selector');

const nullthrows = require('nullthrows');

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
  });

  return selector<T, [RecoilValue<T | DefaultValue>, RecoilValue<T>]>({
    key: `${options.key}__withFallback`,
    get: ({get}) => {
      const baseValue = get(base);
      return baseValue instanceof DefaultValue ? options.default : baseValue;
    },
    set: ({set}, newValue) => set(base, newValue),
    dangerouslyAllowMutability: options.dangerouslyAllowMutability,
  });
}

module.exports = atomWithFallback;
