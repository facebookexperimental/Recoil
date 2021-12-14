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

const {act} = require('ReactTestUtils');

const {
  getRecoilTestFn,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

let React, atom, useRecoilValue, useRecoilTransaction, renderElements;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({
    atom,
    useRecoilTransaction_UNSTABLE: useRecoilTransaction,
    useRecoilValue,
  } = require('../../Recoil_index'));
  ({
    renderElements,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
});

describe('Atoms', () => {
  testRecoil('Get with transaction', () => {
    const myAtom = atom({key: 'useTransaction atom get', default: 'DEFAULT'});

    let readAtom;
    let ranTransaction = false;
    function Component() {
      readAtom = useRecoilTransaction(({get}) => () => {
        expect(get(myAtom)).toEqual('DEFAULT');
        ranTransaction = true;
      });
      return null;
    }
    renderElements(<Component />);
    expect(ranTransaction).toBe(false);

    act(readAtom);
    expect(ranTransaction).toBe(true);
  });

  // TODO Unable to test setting from a transaction as Jest complains about
  // updates not wrapped in act(...)...
  // testRecoil('Set with transaction', () => {
  //   const myAtom = atom<string>({
  //     key: 'useTransaction atom set',
  //     default: 'DEFAULT',
  //   });

  //   let setAtom;
  //   let updateAtom;
  //   function Component() {
  //     setAtom = useRecoilTransaction(({set}) => value => {
  //       act(() => {
  //         set(myAtom, value);
  //       });
  //     });
  //     updateAtom = useRecoilTransaction(({set}) => value => {
  //       set(myAtom, old => {
  //         expect(old).toEqual('SET');
  //         return value;
  //       });
  //     });
  //     return null;
  //   }
  //   const c = renderElements(
  //     <>
  //       <ReadsAtom atom={myAtom} />
  //       <Component />
  //     </>,
  //   );
  //   expect(c.textContent).toEqual('"DEFAULT"');

  //   act(() => setAtom('SET'));
  //   expect(c.textContent).toEqual('"SET"');

  //   act(() => updateAtom('UPDATE'));
  //   expect(c.textContent).toEqual('UPDATE');
  // });
});

describe('Atom Effects', () => {
  testRecoil(
    'Atom effects are run when first get from a transaction',
    async () => {
      let numTimesEffectInit = 0;

      const atomWithEffect = atom({
        key: 'atom effect first get transaction',
        default: 'DEFAULT',
        effects_UNSTABLE: [
          ({trigger}) => {
            expect(trigger).toEqual('get');
            numTimesEffectInit++;
          },
        ],
      });

      let getAtomWithTransaction;
      const Component = () => {
        getAtomWithTransaction = useRecoilTransaction(({get}) => () => {
          expect(get(atomWithEffect)).toEqual('DEFAULT');
        });
        return null;
      };

      renderElements(<Component />);

      act(() => getAtomWithTransaction());

      expect(numTimesEffectInit).toBe(1);
    },
  );

  // TODO Unable to test setting from a transaction as Jest complains about
  // updates not wrapped in act(...)...
  // testRecoil(
  //   'Atom effects are run when first set with a transaction',
  //   async () => {
  //     let numTimesEffectInit = 0;

  //     const atomWithEffect = atom({
  //       key: 'atom effect first set transaction',
  //       default: 'DEFAULT',
  //       effects_UNSTABLE: [
  //         ({trigger}) => {
  //           expect(trigger).toEqual('set');
  //           numTimesEffectInit++;
  //         },
  //       ],
  //     });

  //     let setAtomWithTransaction;
  //     const Component = () => {
  //       setAtomWithTransaction = useRecoilTransaction(({set}) => () => {
  //         set(atomWithEffect, 'SET');
  //       });
  //       return null;
  //     };

  //     renderElements(<Component />);

  //     act(() => setAtomWithTransaction());

  //     expect(numTimesEffectInit).toBe(1);
  //   },
  // );

  testRecoil('Atom effects can initialize for a transaction', async () => {
    let numTimesEffectInit = 0;
    const atomWithEffect = atom({
      key: 'atom effect init transaction',
      default: 'DEFAULT',
      effects_UNSTABLE: [
        ({setSelf}) => {
          setSelf('INIT');
          numTimesEffectInit++;
        },
      ],
    });

    let initAtomWithTransaction;
    const Component = () => {
      initAtomWithTransaction = useRecoilTransaction(({get}) => () => {
        expect(get(atomWithEffect)).toEqual('INIT');
      });
      return null;
    };

    renderElements(<Component />);

    act(() => initAtomWithTransaction());

    expect(numTimesEffectInit).toBe(1);
  });

  testRecoil(
    'Atom effects are initialized once if first seen on transaction and then on root store',
    () => {
      let numTimesEffectInit = 0;

      const atomWithEffect = atom({
        key: 'useTransaction effect first get transaction',
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
        key: 'atom effect first get root',
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
});
