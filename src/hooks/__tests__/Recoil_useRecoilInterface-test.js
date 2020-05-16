/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

const React = require('React');
const {useRef, useState} = require('React');
const {act} = require('ReactTestUtils');
const atom = require('Recoil_atom');
const {useRecoilInterface} = require('Recoil_Hooks');
const {renderElements} = require('Recoil_TestingUtils');

const counterAtom = atom({
  key: `counterAtom`,
  default: 0,
});

test('Interface for non-react code - useRecoilState', () => {
  function nonReactCode(recoilInterface) {
    return recoilInterface.getRecoilState(counterAtom);
  }

  let updateValue;
  const Component = () => {
    const recoilInterface = useRecoilInterface();
    const [value, _updateValue] = nonReactCode(recoilInterface);
    updateValue = _updateValue;
    return value;
  };

  const container = renderElements(<Component />);
  expect(container.textContent).toEqual('0');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('1');
});

test('Interface for non-react code - useRecoilStateNoThrow', () => {
  function nonReactCode(recoilInterface) {
    const [loadable, setValue] = recoilInterface.getRecoilStateLoadable(
      counterAtom,
    );
    const value = loadable.state === 'hasValue' ? loadable.contents : null;
    return [value, setValue];
  }

  let updateValue;
  const Component = () => {
    const recoilInterface = useRecoilInterface();
    const [value, _updateValue] = nonReactCode(recoilInterface);
    updateValue = _updateValue;
    return value;
  };

  const container = renderElements(<Component />);
  expect(container.textContent).toEqual('0');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('1');
});

test('Interface for non-react code - useRecoilValue, useSetRecoilState', () => {
  function nonReactCode(recoilInterface) {
    return [
      recoilInterface.getRecoilValue(counterAtom),
      recoilInterface.getSetRecoilState(counterAtom),
    ];
  }

  let updateValue;
  const Component = () => {
    const recoilInterface = useRecoilInterface();
    const [value, _updateValue] = nonReactCode(recoilInterface);
    updateValue = _updateValue;
    return value;
  };

  const container = renderElements(<Component />);
  expect(container.textContent).toEqual('0');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('1');
});

test('Interface for non-react code - useRecoilValueNoThrow', () => {
  function nonReactCode(recoilInterface) {
    const value = recoilInterface
      .getRecoilValueLoadable(counterAtom)
      .valueMaybe();
    const setValue = recoilInterface.getSetRecoilState(counterAtom);
    return [value, setValue];
  }

  let updateValue;
  const Component = () => {
    const recoilInterface = useRecoilInterface();
    const [value, _updateValue] = nonReactCode(recoilInterface);
    updateValue = _updateValue;
    return value;
  };

  const container = renderElements(<Component />);
  expect(container.textContent).toEqual('0');
  act(() => updateValue(1));
  expect(container.textContent).toEqual('1');
});

// Test that we always get a consistent instance of the interface object and
// hooks from useRecoilInterface() (at least for a given <AppRoot> store)
test('Consistent interface object', () => {
  let setValue;
  const Component = () => {
    const [value, _setValue] = useState(0);
    const recoilInterface = useRecoilInterface();
    const recoilInterfaceRef = useRef(recoilInterface);
    expect(recoilInterface).toBe(recoilInterfaceRef.current);
    expect(recoilInterface.getRecoilState).toBe(recoilInterface.getRecoilState);
    setValue = _setValue;
    return value;
  };
  const out = renderElements(<Component />);
  expect(out.textContent).toBe('0');
  act(() => setValue(1)); // Force a re-render of the Component
  expect(out.textContent).toBe('1');
});
