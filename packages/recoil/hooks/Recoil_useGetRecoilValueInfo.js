/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilValueInfo} from '../core/Recoil_FunctionalCore';
import type {RecoilValue} from '../core/Recoil_RecoilValue';

import {peekNodeInfo} from '../core/Recoil_FunctionalCore';
import {useStoreRef} from '../core/Recoil_RecoilRoot';

export default function useGetRecoilValueInfo(): <T>(
  RecoilValue<T>,
) => RecoilValueInfo<T> {
  const storeRef = useStoreRef();

  return <T>({key}): RecoilValueInfo<T> =>
    peekNodeInfo<T>(
      storeRef.current,
      storeRef.current.getState().currentTree,
      key,
    );
}
