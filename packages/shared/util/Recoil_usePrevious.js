/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

const {useEffect, useRef} = require('react');

function usePrevious<T>(value: T): T | void {
  const ref = useRef();
  useEffect(() => {
    // $FlowFixMe[incompatible-type]
    ref.current = value;
  });
  return ref.current;
}

module.exports = usePrevious;
