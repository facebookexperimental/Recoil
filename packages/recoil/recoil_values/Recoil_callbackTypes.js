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

import type {DefaultValue} from '../core/Recoil_Node';
import type {RecoilState, RecoilValue} from '../core/Recoil_RecoilValue';

export type ValueOrUpdater<T, U> =
  | U
  | DefaultValue
  | ((prevValue: T) => U | DefaultValue);
export type GetRecoilValue = <T, U>(RecoilValue<T, U>) => T;
export type SetRecoilState = <T, U>(
  RecoilState<T, U>,
  ValueOrUpdater<T, U>,
) => void;
export type ResetRecoilState = <T, U>(RecoilState<T, U>) => void;

module.exports = ({}: {...});
