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

import type {RecoilStore} from '../core/Recoil_RecoilRoot.react';

const {useStoreRef} = require('../core/Recoil_RecoilRoot.react');

function useRecoilStore(): RecoilStore {
  return useStoreRef().current;
}

module.exports = useRecoilStore;

