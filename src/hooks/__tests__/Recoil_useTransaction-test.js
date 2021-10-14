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

const {getRecoilTestFn} = require('../../__test_utils__/Recoil_TestingUtils');

let React, atom, useRecoilValue, useRecoilTransaction, renderElements;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({
    atom,
    useRecoilTransaction_UNSTABLE: useRecoilTransaction,
    useRecoilValue,
  } = require('../../Recoil_index'));
  ({renderElements} = require('../../__test_utils__/Recoil_TestingUtils'));
});

testRecoil(
  'Atom effects are initialized once if first seen on transaction and then on root store',
  () => {
    let numTimesEffectInit = 0;

    const atomWithEffect = atom({
      key: 'atomWithEffect',
      default: 0,
      effects_UNSTABLE: [
        () => {
          numTimesEffectInit++;
        },
      ],
    });

    const Component = () => {
      const readAtomFromSnapshot = useRecoilTransaction(({get}) => () => {
        get(atomWithEffect);
      });

      readAtomFromSnapshot(); // first initialization

      expect(numTimesEffectInit).toBe(1);

      /**
       * Transactions do not use a snapshot under the hood, so any initialized
       * effects from a transaction will be reflected in root store
       */
      useRecoilValue(atomWithEffect);

      expect(numTimesEffectInit).toBe(1);

      return null;
    };

    renderElements(<Component />);

    expect(numTimesEffectInit).toBe(1);
  },
);

testRecoil(
  'Atom effects are initialized once if first seen on root store and then on snapshot',
  () => {
    let numTimesEffectInit = 0;

    const atomWithEffect = atom({
      key: 'atomWithEffect2',
      default: 0,
      effects_UNSTABLE: [
        () => {
          numTimesEffectInit++;
        },
      ],
    });

    const Component = () => {
      const readAtomFromSnapshot = useRecoilTransaction(({get}) => () => {
        get(atomWithEffect);
      });

      useRecoilValue(atomWithEffect); // first initialization

      expect(numTimesEffectInit).toBe(1);

      /**
       * Transactions do not use a snapshot under the hood, so any initialized
       * effects from a transaction will be reflected in root store
       */
      readAtomFromSnapshot();

      expect(numTimesEffectInit).toBe(1);

      return null;
    };

    renderElements(<Component />);

    expect(numTimesEffectInit).toBe(1);
  },
);
