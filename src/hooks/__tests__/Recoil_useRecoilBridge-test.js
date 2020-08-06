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

const React = require('React');
const ReactDOM = require('ReactDOM');
const {act} = require('ReactTestUtils');

const {RecoilRoot} = require('../../core/Recoil_RecoilRoot.react');
const atom = require('../../recoil_values/Recoil_atom');
const {SimpleRenderer} = require('../../testing/Recoil_SimpleReconciler');
const {
  componentThatReadsAndWritesAtom,
} = require('../../testing/Recoil_TestingUtils');
const useRecoilBridge = require('../Recoil_useRecoilBridge');

test('useRecoilBridge - create a context bridge', () => {
  const myAtom = atom({
    key: 'useRecoilBridge - context bridge',
    default: 'DEFAULT',
  });

  function initializeState({set, getLoadable}) {
    expect(getLoadable(myAtom).contents).toEqual('DEFAULT');
    set(myAtom, 'INITIALIZE');
    expect(getLoadable(myAtom).contents).toEqual('INITIALIZE');
  }

  const [ReadWriteAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);

  function TestApp() {
    const RecoilBridge = useRecoilBridge();
    return (
      <>
        <ReadWriteAtom />

        <SimpleRenderer>
          <RecoilBridge>
            <ReadWriteAtom />
          </RecoilBridge>
        </SimpleRenderer>
      </>
    );
  }

  const container = document.createElement('div');
  act(() => {
    ReactDOM.render(
      <RecoilRoot initializeState={initializeState}>
        <TestApp />
      </RecoilRoot>,
      container,
    );
  });

  expect(container.textContent).toEqual('"INITIALIZE""INITIALIZE"');

  act(() => setAtom('SET'));
  expect(container.textContent).toEqual('"SET""SET"');
});
