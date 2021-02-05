/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilState} from 'Recoil';

const {atom, useRecoilState} = require('recoil');

const FilterAtom = atom({
  key: 'filter-atom',
  default: '',
});

const useFilter = (): [string, (string) => void] => {
  return useRecoilState(FilterAtom);
};

const SelectecTransactionAtom = atom({
  key: 'selected-tx',
  default: 0,
});

const useSelectedTransaction = (): [number, (number) => void] => {
  return useRecoilState(SelectecTransactionAtom);
};

module.exports = {useFilter, useSelectedTransaction};
