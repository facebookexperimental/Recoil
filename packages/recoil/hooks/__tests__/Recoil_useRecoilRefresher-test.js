/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

'use strict';

const {getRecoilTestFn} = require('../../__test_utils__/Recoil_TestingUtils');

let React,
  act,
  atom,
  selector,
  renderElements,
  useRecoilValue,
  useSetRecoilState,
  useRecoilRefresher;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({act} = require('ReactTestUtils'));
  atom = require('../../recoil_values/Recoil_atom');
  selector = require('../../recoil_values/Recoil_selector');
  ({renderElements} = require('../../__test_utils__/Recoil_TestingUtils'));
  ({
    useRecoilRefresher,
    useRecoilValue,
    useSetRecoilState,
  } = require('../Recoil_Hooks'));
});

testRecoil('useRerunRecoilValue - no-op for atom', async () => {
  const myAtom = atom({
    key: 'useRerunRecoilValue/atom',
    default: 'default',
  });

  let refresh;
  function Component() {
    const value = useRecoilValue(myAtom);
    refresh = useRecoilRefresher(myAtom);
    return value;
  }

  const container = renderElements(<Component />);
  expect(container.textContent).toBe('default');
  act(() => refresh());
  expect(container.textContent).toBe('default');
});

testRecoil('useRerunRecoilValue - re-executes selector', async () => {
  let i = 0;
  const myselector = selector({
    key: 'useRerunRecoilValue/selector',
    get: () => i++,
  });

  let refresh;
  function Component() {
    const value = useRecoilValue(myselector);
    refresh = useRecoilRefresher(myselector);
    return value;
  }

  const container = renderElements(<Component />);
  expect(container.textContent).toBe('0');
  act(() => refresh());
  expect(container.textContent).toBe('1');
});

testRecoil('useRerunRecoilValue - clears entire cache', async () => {
  const myatom = atom({
    key: 'useRerunRecoilValue/myatom',
    default: 'a',
  });

  let i = 0;
  const myselector = selector({
    key: 'useRerunRecoilValue/selector',
    get: ({get}) => [get(myatom), i++],
  });

  let setMyAtom;
  let refresh;
  function Component() {
    const [atomValue, iValue] = useRecoilValue(myselector);
    refresh = useRecoilRefresher(myselector);
    setMyAtom = useSetRecoilState(myatom);
    return `${atomValue}-${iValue}`;
  }

  const container = renderElements(<Component />);
  expect(container.textContent).toBe('a-0');

  act(() => setMyAtom('b'));
  expect(container.textContent).toBe('b-1');

  act(() => refresh());
  expect(container.textContent).toBe('b-2');

  act(() => setMyAtom('a'));
  expect(container.textContent).toBe('a-3');
});
