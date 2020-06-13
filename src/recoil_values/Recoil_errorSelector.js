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

import type {RecoilValueReadOnly} from '../core/Recoil_RecoilValue';

const cacheWithReferenceEquality = require('../caches/Recoil_cacheWithReferenceEquality');
const selectorFamily = require('./Recoil_selectorFamily');

// flowlint-next-line unclear-type:off
const throwingSelector = selectorFamily<any, any>({
  key: '__error',
  get: message => () => {
    throw new Error(message);
  },
  cacheImplementationForParams_UNSTABLE: cacheWithReferenceEquality,
});

// Function that returns a selector which always throws an error
// with the provided message.
function errorSelector<T>(message: string): RecoilValueReadOnly<T> {
  return throwingSelector(message);
}

module.exports = errorSelector;
