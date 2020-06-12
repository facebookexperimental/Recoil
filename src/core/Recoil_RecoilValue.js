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

import type {GetRecoilValue} from '../recoil_values/Recoil_selector_OLD';
import type {NodeKey} from './Recoil_State';

const mapSelector = require('../recoil_values/Recoil_mapSelector');

class AbstractRecoilValue<+T> {
  key: NodeKey;

  constructor(newKey: NodeKey) {
    this.key = newKey;
  }

  map<S>(map: (T, {get: GetRecoilValue}) => S): RecoilValueReadOnly<S> {
    return mapSelector<T, S>(this, map);
  }
}

class RecoilState<T> extends AbstractRecoilValue<T> {}

class RecoilValueReadOnly<+T> extends AbstractRecoilValue<T> {}

export type RecoilValue<T> = RecoilValueReadOnly<T> | RecoilState<T>;

function isRecoilValue(x: mixed): boolean %checks {
  return x instanceof RecoilState || x instanceof RecoilValueReadOnly;
}

module.exports = {
  AbstractRecoilValue,
  RecoilState,
  RecoilValueReadOnly,
  isRecoilValue,
};
