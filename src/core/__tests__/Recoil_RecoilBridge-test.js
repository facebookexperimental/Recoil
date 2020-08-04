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

const {
  RecoilBridge,
  RecoilRoot,
} = require('../../core/Recoil_RecoilRoot.react');
const atom = require('../../recoil_values/Recoil_atom');
const {SimpleRenderer} = require('../../testing/Recoil_SimpleReconciler');
const {
  componentThatReadsAndWritesAtom,
} = require('../../testing/Recoil_TestingUtils');

test('BridgedRecoilRoot - Context bridging with a nested renderer', () => {
  const container = document.createElement('div');

  const myAtom = atom({
    key: 'BridgedRecoilRoot - context bridge',
    default: 'DEFAULT',
  });

  function initializeState({set, getLoadable}) {
    expect(getLoadable(myAtom).contents).toEqual('DEFAULT');
    set(myAtom, 'INITIALIZE');
    expect(getLoadable(myAtom).contents).toEqual('INITIALIZE');
  }

  const [ReadWriteAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);

  act(() => {
    ReactDOM.render(
      <RecoilRoot initializeState={initializeState}>
        <ReadWriteAtom />

        <RecoilBridge>
          {BridgedRecoilRoot => (
            <SimpleRenderer>
              <BridgedRecoilRoot>
                <ReadWriteAtom />
              </BridgedRecoilRoot>
            </SimpleRenderer>
          )}
        </RecoilBridge>
      </RecoilRoot>,
      container,
    );
  });

  expect(container.textContent).toEqual('"INITIALIZE""INITIALIZE"');

  act(() => setAtom('SET'));
  expect(container.textContent).toEqual('"SET""SET"');
});
