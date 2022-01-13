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

import type {TransactionInterface} from '../core/Recoil_AtomicUpdates';

import {atomicUpdater} from '../core/Recoil_AtomicUpdates';
import {useStoreRef} from '../core/Recoil_RecoilRoot';
import {useMemo} from 'react';

export default function useRecoilTransaction<Arguments: $ReadOnlyArray<mixed>>(
  fn: TransactionInterface => (...Arguments) => void,
  deps?: $ReadOnlyArray<mixed>,
): (...Arguments) => void {
  const storeRef = useStoreRef();
  return useMemo(
    () =>
      (...args: Arguments): void => {
        const atomicUpdate = atomicUpdater(storeRef.current);
        atomicUpdate(transactionInterface => {
          fn(transactionInterface)(...args);
        });
      },
    deps != null ? [...deps, storeRef] : undefined, // eslint-disable-line fb-www/react-hooks-deps
  );
}
