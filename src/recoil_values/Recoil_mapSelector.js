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

import type {
  AbstractRecoilValue,
  RecoilValueReadOnly,
} from '../core/Recoil_RecoilValue';
import type {GetRecoilValue} from './Recoil_selector_OLD';

const cacheWithReferenceEquality = require('../caches/Recoil_cacheWithReferenceEquality');
const selectorFamily = require('./Recoil_selectorFamily');

// flowlint-next-line unclear-type:off
const mappingSelector = selectorFamily<any, any>({
  key: '__map',
  get: ([dep, map]) => ({get}) => map(get(dep), {get}),
  cacheImplementationForParams_UNSTABLE: cacheWithReferenceEquality,
});

function mapSelector<T, S>(
  dep: AbstractRecoilValue<T>,
  map: (T, {get: GetRecoilValue}) => S,
): RecoilValueReadOnly<S> {
  return mappingSelector([dep, map]);
}

module.exports = mapSelector;
