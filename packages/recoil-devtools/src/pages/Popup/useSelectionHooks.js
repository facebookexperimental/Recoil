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

import type {RecoilState} from 'recoil';

const {atom, useRecoilState} = require('recoil');

const FilterAtom = atom({
  key: 'filter-atom',
  default: '',
});

const useFilter = () => {
  return useRecoilState<string>(FilterAtom);
};

const SelectecTransactionAtom = atom({
  key: 'selected-tx',
  default: 0,
});

const useSelectedTransaction = () => {
  return useRecoilState<number>(SelectecTransactionAtom);
};

module.exports = {useFilter, useSelectedTransaction};
