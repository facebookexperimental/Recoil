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

import type {RecoilValue} from '../core/Recoil_RecoilValue';

import {useStoreRef} from '../core/Recoil_RecoilRoot';
import {refreshRecoilValue} from '../core/Recoil_RecoilValueInterface';
import {useCallback} from 'react';

export default function useRecoilRefresher<T>(
  recoilValue: RecoilValue<T>,
): () => void {
  const storeRef = useStoreRef();
  return useCallback(() => {
    const store = storeRef.current;
    refreshRecoilValue(store, recoilValue);
  }, [recoilValue, storeRef]);
}
