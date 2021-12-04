/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';
import type {SetterOrUpdater} from 'recoil/hooks/Recoil_Hooks';
import type {RecoilState} from 'recoil';

import {atom, useRecoilState} from 'recoil';

const FilterAtom = atom({
  key: 'filter-atom',
  default: '',
});

const useFilter = (): [string, SetterOrUpdater<string>] => {
  return useRecoilState<string>(FilterAtom);
};

const SelectecTransactionAtom = atom({
  key: 'selected-tx',
  default: 0,
});

const useSelectedTransaction = (): [number, SetterOrUpdater<number>] => {
  return useRecoilState<number>(SelectecTransactionAtom);
};

module.exports = {useFilter, useSelectedTransaction};
