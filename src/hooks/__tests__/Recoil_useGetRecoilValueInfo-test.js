/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {getRecoilTestFn} = require('../../testing/Recoil_TestingUtils');

let React,
  act,
  atom,
  selector,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  renderElements,
  useGetRecoilValueInfo;

const testRecoil = getRecoilTestFn(() => {
  React = require('React');
  ({act} = require('ReactTestUtils'));

  atom = require('../../recoil_values/Recoil_atom');
  selector = require('../../recoil_values/Recoil_selector');
  ({
    ReadsAtom,
    componentThatReadsAndWritesAtom,
    renderElements,
  } = require('../../testing/Recoil_TestingUtils'));
  useGetRecoilValueInfo = require('../Recoil_useGetRecoilValueInfo');
});

testRecoil(
  'useGetRecoilValueInfo',
  gk => {
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

    let getRecoilValueInfo = _ => {
      expect(false).toBe(true);
      throw new Error('getRecoilValue not set');
    };
    function GetRecoilValueInfo() {
      getRecoilValueInfo = useGetRecoilValueInfo();
      return null;
    }

    // Initial status
    renderElements(<GetRecoilValueInfo />);

    expect(getRecoilValueInfo(myAtom)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: false,
      isSet: false,
      isModified: false,
      type: undefined,
    });
    expect(Array.from(getRecoilValueInfo(myAtom).deps)).toEqual([]);
    expect(Array.from(getRecoilValueInfo(myAtom).subscribers.nodes)).toEqual(
      [],
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(myAtom).subscribers.components),
      ).toEqual([]);
    }
    expect(getRecoilValueInfo(selectorA)).toMatchObject({
      loadable: undefined,
      isActive: false,
      isSet: false,
      isModified: false,
      type: undefined,
    });
    expect(Array.from(getRecoilValueInfo(selectorA).deps)).toEqual([]);
    expect(Array.from(getRecoilValueInfo(selectorA).subscribers.nodes)).toEqual(
      [],
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(selectorA).subscribers.components),
      ).toEqual([]);
    }
    expect(getRecoilValueInfo(selectorB)).toMatchObject({
      loadable: undefined,
      isActive: false,
      isSet: false,
      isModified: false,
      type: undefined,
    });
    expect(Array.from(getRecoilValueInfo(selectorB).deps)).toEqual([]);
    expect(Array.from(getRecoilValueInfo(selectorB).subscribers.nodes)).toEqual(
      [],
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(selectorB).subscribers.components),
      ).toEqual([]);
    }

    // After reading values
    const [ReadWriteAtom, setAtom, resetAtom] = componentThatReadsAndWritesAtom(
      myAtom,
    );
    const c = renderElements(
      <>
        <GetRecoilValueInfo />
        <ReadWriteAtom />
        <ReadsAtom atom={selectorB} />
      </>,
    );
    expect(c.textContent).toEqual('"DEFAULT""DEFAULTDEFAULT"');

    expect(getRecoilValueInfo(myAtom)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'atom',
    });
    expect(Array.from(getRecoilValueInfo(myAtom).deps)).toEqual([]);
    expect(Array.from(getRecoilValueInfo(myAtom).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorA, selectorB]),
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(myAtom).subscribers.components),
      ).toEqual([{name: 'ReadsAndWritesAtom'}]);
    }
    expect(getRecoilValueInfo(selectorA)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getRecoilValueInfo(selectorA).deps)).toEqual(
      expect.arrayContaining([myAtom]),
    );
    expect(Array.from(getRecoilValueInfo(selectorA).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorB]),
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(selectorA).subscribers.components),
      ).toEqual([]);
    }
    expect(getRecoilValueInfo(selectorB)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULTDEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getRecoilValueInfo(selectorB).deps)).toEqual(
      expect.arrayContaining([myAtom, selectorA]),
    );
    expect(Array.from(getRecoilValueInfo(selectorB).subscribers.nodes)).toEqual(
      [],
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(selectorB).subscribers.components),
      ).toEqual([{name: 'ReadsAtom'}]);
    }

    // After setting a value
    act(() => setAtom('SET'));

    expect(getRecoilValueInfo(myAtom)).toMatchObject({
      loadable: expect.objectContaining({state: 'hasValue', contents: 'SET'}),
      isActive: true,
      isSet: true,
      isModified: true,
      type: 'atom',
    });
    expect(Array.from(getRecoilValueInfo(myAtom).deps)).toEqual([]);
    expect(Array.from(getRecoilValueInfo(myAtom).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorA, selectorB]),
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(myAtom).subscribers.components),
      ).toEqual([{name: 'ReadsAndWritesAtom'}]);
    }
    expect(getRecoilValueInfo(selectorA)).toMatchObject({
      loadable: expect.objectContaining({state: 'hasValue', contents: 'SET'}),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getRecoilValueInfo(selectorA).deps)).toEqual(
      expect.arrayContaining([myAtom]),
    );
    expect(Array.from(getRecoilValueInfo(selectorA).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorB]),
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(selectorA).subscribers.components),
      ).toEqual([]);
    }
    expect(getRecoilValueInfo(selectorB)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'SETSET',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getRecoilValueInfo(selectorB).deps)).toEqual(
      expect.arrayContaining([myAtom, selectorA]),
    );
    expect(Array.from(getRecoilValueInfo(selectorB).subscribers.nodes)).toEqual(
      [],
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(selectorB).subscribers.components),
      ).toEqual([{name: 'ReadsAtom'}]);
    }

    // After reseting a value
    act(resetAtom);

    expect(getRecoilValueInfo(myAtom)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: true,
      type: 'atom',
    });
    expect(Array.from(getRecoilValueInfo(myAtom).deps)).toEqual([]);
    expect(Array.from(getRecoilValueInfo(myAtom).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorA, selectorB]),
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(myAtom).subscribers.components),
      ).toEqual([{name: 'ReadsAndWritesAtom'}]);
    }
    expect(getRecoilValueInfo(selectorA)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getRecoilValueInfo(selectorA).deps)).toEqual(
      expect.arrayContaining([myAtom]),
    );
    expect(Array.from(getRecoilValueInfo(selectorA).subscribers.nodes)).toEqual(
      expect.arrayContaining([selectorB]),
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(selectorA).subscribers.components),
      ).toEqual([]);
    }
    expect(getRecoilValueInfo(selectorB)).toMatchObject({
      loadable: expect.objectContaining({
        state: 'hasValue',
        contents: 'DEFAULTDEFAULT',
      }),
      isActive: true,
      isSet: false,
      isModified: false,
      type: 'selector',
    });
    expect(Array.from(getRecoilValueInfo(selectorB).deps)).toEqual(
      expect.arrayContaining([myAtom, selectorA]),
    );
    expect(Array.from(getRecoilValueInfo(selectorB).subscribers.nodes)).toEqual(
      [],
    );
    if (gk === 'recoil_infer_component_names') {
      expect(
        Array.from(getRecoilValueInfo(selectorB).subscribers.components),
      ).toEqual([{name: 'ReadsAtom'}]);
    }
  },
  // @fb-only: {gks: ['recoil_infer_component_names']},
);
