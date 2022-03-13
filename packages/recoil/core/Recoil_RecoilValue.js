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

import type {NodeKey} from './Recoil_State';

// eslint-disable-next-line no-unused-vars
class AbstractRecoilValue<+T> {
  key: NodeKey;
  constructor(newKey: NodeKey) {
    this.key = newKey;
  }
}

class RecoilState<T, U = T> extends AbstractRecoilValue<T> {}

class RecoilValueReadOnly<+T> extends AbstractRecoilValue<T> {}

export type RecoilValue<T, U> = RecoilValueReadOnly<T> | RecoilState<T, U>;

function isRecoilValue(x: mixed): boolean %checks {
  return x instanceof RecoilState || x instanceof RecoilValueReadOnly;
}

module.exports = {
  AbstractRecoilValue,
  RecoilState,
  RecoilValueReadOnly,
  isRecoilValue,
};
