/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */
'use strict';

const {useRef} = require('React');

const shallowArrayEqual = require('./Recoil_shallowArrayEqual');

// Like useMemo but always memoized (React is allowed to expunge useMemo).
export default function useMemoAlways<T>(
  fn: () => T,
  deps: $ReadOnlyArray<mixed>,
): T {
  const stateRef = useRef(undefined);
  const prevDepsRef = useRef(deps);

  if (deps === prevDepsRef.current) {
    stateRef.current = fn(); // first run
  } else if (!shallowArrayEqual(deps, prevDepsRef.current)) {
    stateRef.current = fn();
    prevDepsRef.current = deps;
  }

  // flowlint-next-line unclear-type: off
  return (stateRef.current: any); // flow cannot infer that stateRef will always have been set
}
