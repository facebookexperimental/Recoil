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
import type {Parameter} from './Recoil_selectorFamily';

const cacheWithReferenceEquality = require('../caches/Recoil_cacheWithReferenceEquality');
const selectorFamily = require('./Recoil_selectorFamily');

// flowlint-next-line unclear-type:off
const constantSelector = selectorFamily<any, any>({
  key: '__constant',
  get: constant => () => constant,
  cacheImplementationForParams_UNSTABLE: cacheWithReferenceEquality,
});

// Function that returns a selector which always produces the
// same constant value.  It may be called multiple times with the
// same value, based on reference equality, and will provide the
// same selector.
function constSelector<T: Parameter>(constant: T): RecoilValueReadOnly<T> {
  return constantSelector(constant);
}

module.exports = constSelector;
