/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

const {useRef} = require('react');

/**
 * The same as `useRef()` except that if a function is specified then it will
 * call that function to get the value to initialize the reference with.
 * This is similar to how `useState()` behaves when given a function.  It allows
 * the user to avoid generating the initial value for subsequent renders.
 * The tradeoff is that to set the reference to a function itself you need to
 * nest it: useRefInitOnce(() => () => {...});
 */
function useRefInitOnce<T>(initialValue: (() => T) | T): {current: T} {
  // $FlowExpectedError[incompatible-call]
  const ref = useRef<T>(initialValue);
  if (ref.current === initialValue && typeof initialValue === 'function') {
    // $FlowExpectedError[incompatible-use]
    ref.current = initialValue();
  }
  return ref;
}

module.exports = useRefInitOnce;
