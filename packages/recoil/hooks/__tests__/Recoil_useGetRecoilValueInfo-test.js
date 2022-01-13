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

const {
  getRecoilTestFn,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

let React,
  act,
  atom,
  selector,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  renderElements,
  useGetRecoilValueInfo;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({act} = require('ReactTestUtils'));

  atom = require('../../recoil_values/Recoil_atom');
  selector = require('../../recoil_values/Recoil_selector');
  ({
    ReadsAtom,
    componentThatReadsAndWritesAtom,
    renderElements,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  useGetRecoilValueInfo = require('../Recoil_useGetRecoilValueInfo');
});

testRecoil(
  'useGetRecoilValueInfo',
  ({gks}) => {
    const myAtom = atom<string>({
      key: 'useGetRecoilValueInfo atom',
      default: 'DEFAULT',
    });
    const selectorA = selector({
      key: 'useGetRecoilValueInfo A',
      get: ({get}) => get(myAtom),
    });
    const selectorB = selector({
      key: 'useGetRecoilValueInfo B',
      get: ({get}) => get(selectorA) + get(myAtom),
    });

    let getNodeInfo = _ => {
      expect(false).toBe(true);
      throw new Error('getRecoilValue not set');
    };
    function GetRecoilValueInfo() {
      const getRecoilValueInfo = useGetRecoilValueInfo();
      getNodeInfo = node => ({...getRecoilValueInfo(node)});
      return null;
    }

    // Initial status
    renderElements(<GetRecoilValueInfo />);

    expect(getNodeInfo(myAtom)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: false,
      isSet: false,
      isModified: false,
      type: 'atom',
    });
    expect(Array.from(getNodeInfo(myAtom).deps)).toEqual([]);
    expect(Array.from(getNodeInfo(myAtom).subscribers.nodes)).toEqual([]);
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(myAtom).subscribers.components)).toEqual(
        [],
      );
    }
    expect(getNodeInfo(selectorA)).toMatchObject({
      loadable: undefined,
      isActive: false,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getNodeInfo(selectorA).deps)).toEqual([]);
    expect(Array.from(getNodeInfo(selectorA).subscribers.nodes)).toEqual([]);
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(selectorA).subscribers.components)).toEqual(
        [],
      );
    }
    expect(getNodeInfo(selectorB)).toMatchObject({
      loadable: undefined,
      isActive: false,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getNodeInfo(selectorB).deps)).toEqual([]);
    expect(Array.from(getNodeInfo(selectorB).subscribers.nodes)).toEqual([]);
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(selectorB).subscribers.components)).toEqual(
        [],
      );
    }

    // After reading values
    const [ReadWriteAtom, setAtom, resetAtom] =
      componentThatReadsAndWritesAtom(myAtom);
    const c = renderElements(
      <>
        <GetRecoilValueInfo />
        <ReadWriteAtom />
        <ReadsAtom atom={selectorB} />
      </>,
    );
    expect(c.textContent).toEqual('"DEFAULT""DEFAULTDEFAULT"');

    expect(getNodeInfo(myAtom)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'atom',
    });
    expect(Array.from(getNodeInfo(myAtom).deps)).toEqual([]);
    expect(Array.from(getNodeInfo(myAtom).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorA, selectorB]),
    );
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(myAtom).subscribers.components)).toEqual([
        {name: 'ReadsAndWritesAtom'},
      ]);
    }
    expect(getNodeInfo(selectorA)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getNodeInfo(selectorA).deps)).toEqual(
      expect.arrayContaining([myAtom]),
    );
    expect(Array.from(getNodeInfo(selectorA).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorB]),
    );
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(selectorA).subscribers.components)).toEqual(
        [],
      );
    }
    expect(getNodeInfo(selectorB)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULTDEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getNodeInfo(selectorB).deps)).toEqual(
      expect.arrayContaining([myAtom, selectorA]),
    );
    expect(Array.from(getNodeInfo(selectorB).subscribers.nodes)).toEqual([]);
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(selectorB).subscribers.components)).toEqual(
        [{name: 'ReadsAtom'}],
      );
    }

    // After setting a value
    act(() => setAtom('SET'));

    expect(getNodeInfo(myAtom)).toMatchObject({
      loadable: expect.objectContaining({state: 'hasValue', contents: 'SET'}),
      isActive: true,
      isSet: true,
      isModified: true,
      type: 'atom',
    });
    expect(Array.from(getNodeInfo(myAtom).deps)).toEqual([]);
    expect(Array.from(getNodeInfo(myAtom).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorA, selectorB]),
    );
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(myAtom).subscribers.components)).toEqual([
        {name: 'ReadsAndWritesAtom'},
      ]);
    }
    expect(getNodeInfo(selectorA)).toMatchObject({
      loadable: expect.objectContaining({state: 'hasValue', contents: 'SET'}),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getNodeInfo(selectorA).deps)).toEqual(
      expect.arrayContaining([myAtom]),
    );
    expect(Array.from(getNodeInfo(selectorA).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorB]),
    );
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(selectorA).subscribers.components)).toEqual(
        [],
      );
    }
    expect(getNodeInfo(selectorB)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'SETSET',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getNodeInfo(selectorB).deps)).toEqual(
      expect.arrayContaining([myAtom, selectorA]),
    );
    expect(Array.from(getNodeInfo(selectorB).subscribers.nodes)).toEqual([]);
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(selectorB).subscribers.components)).toEqual(
        [{name: 'ReadsAtom'}],
      );
    }

    // After reseting a value
    act(resetAtom);

    expect(getNodeInfo(myAtom)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: true,
      type: 'atom',
    });
    expect(Array.from(getNodeInfo(myAtom).deps)).toEqual([]);
    expect(Array.from(getNodeInfo(myAtom).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorA, selectorB]),
    );
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(myAtom).subscribers.components)).toEqual([
        {name: 'ReadsAndWritesAtom'},
      ]);
    }
    expect(getNodeInfo(selectorA)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getNodeInfo(selectorA).deps)).toEqual(
      expect.arrayContaining([myAtom]),
    );
    expect(Array.from(getNodeInfo(selectorA).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorB]),
    );
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(selectorA).subscribers.components)).toEqual(
        [],
      );
    }
    expect(getNodeInfo(selectorB)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULTDEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getNodeInfo(selectorB).deps)).toEqual(
      expect.arrayContaining([myAtom, selectorA]),
    );
    expect(Array.from(getNodeInfo(selectorB).subscribers.nodes)).toEqual([]);
    if (gks.includes('recoil_infer_component_names')) {
      expect(Array.from(getNodeInfo(selectorB).subscribers.components)).toEqual(
        [{name: 'ReadsAtom'}],
      );
    }
  },
  // @fb-only: {gks: [['recoil_infer_component_names']]},
);
