/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */
'use strict';

const {
  getRecoilTestFn,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

let React,
  act,
  atom,
  atomFamily,
  selector,
  selectorFamily,
  asyncSelector,
  componentThatReadsAndWritesAtom,
  renderElements;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({act} = require('ReactTestUtils'));

  atom = require('../../recoil_values/Recoil_atom');
  atomFamily = require('../../recoil_values/Recoil_atomFamily');
  selector = require('../../recoil_values/Recoil_selector');
  selectorFamily = require('../../recoil_values/Recoil_selectorFamily');
  ({
    asyncSelector,
    componentThatReadsAndWritesAtom,
    renderElements,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
});

testRecoil('useRecoilValueReset - value default', () => {
  const myAtom = atom({
    key: 'useResetRecoilState/atom',
    default: 'default',
  });

  const [Component, setValue, resetValue] =
    componentThatReadsAndWritesAtom(myAtom);
  const container = renderElements(<Component />);
  expect(container.textContent).toBe('"default"');
  act(() => setValue('set value'));
  expect(container.textContent).toBe('"set value"');
  act(() => resetValue());
  expect(container.textContent).toBe('"default"');
});

testRecoil('useResetRecoilState - sync selector default', () => {
  const mySelector = selector({
    key: 'useResetRecoilState/sync_selector/default',
    get: () => 'fallback',
  });
  const myAtom = atom({
    key: 'useResetRecoilState/sync_selector',
    default: mySelector,
  });

  const [Component, setValue, resetValue] =
    componentThatReadsAndWritesAtom(myAtom);
  const container = renderElements(<Component />);
  expect(container.textContent).toBe('"fallback"');
  act(() => setValue('set value'));
  expect(container.textContent).toBe('"set value"');
  act(() => resetValue());
  expect(container.textContent).toBe('"fallback"');
});

// Test resetting an atom to a fallback selector with a pending async value
testRecoil('useResetRecoilState - async selector default', () => {
  const [mySelector, resolve] = asyncSelector();
  const myAtom = atom({
    key: 'useResetRecoilState/async_selector',
    default: mySelector,
  });

  const [Component, setValue, resetValue] =
    componentThatReadsAndWritesAtom(myAtom);
  const container = renderElements(<Component />);
  expect(container.textContent).toBe('loading');
  act(() => setValue('set value'));
  act(() => jest.runAllTimers()); // Hmm, interesting this is required
  expect(container.textContent).toBe('"set value"');
  act(() => resetValue());
  expect(container.textContent).toBe('loading');
  act(() => resolve('resolved fallback'));
  act(() => jest.runAllTimers());
  expect(container.textContent).toBe('"resolved fallback"');
});

// Test resetting an atom to a fallback selector with a pending async value
testRecoil('useResetRecoilState - scoped atom', () => {
  return; // @oss-only
  const myAtom = atom({
    key: 'useResetRecoilState/scoped_atom',
    default: 'default',
    scopeRules_APPEND_ONLY_READ_THE_DOCS: [
      [atom({key: 'useResetRecoilState/scoped_atom/scope_rule', default: 0})],
    ],
  });

  const [Component, setValue, resetValue] =
    componentThatReadsAndWritesAtom(myAtom);
  const container = renderElements(<Component />);
  expect(container.textContent).toBe('"default"');
  act(() => setValue('set value'));
  expect(container.textContent).toBe('"set value"');
  act(() => resetValue());
  expect(container.textContent).toBe('"default"');
  // TODO test resetting a scoped atom that was upgraded with a new rule
});

// Test resetting an atom to a fallback selector with a pending async value
testRecoil('useResetRecoilState - atom family', () => {
  const myAtom = atomFamily({
    key: 'useResetRecoilState/atomFamily',
    default: ({default: def}) => def,
  });

  const [Component, setValue, resetValue] = componentThatReadsAndWritesAtom(
    myAtom({default: 'default'}),
  );
  const [ComponentB, setValueB, resetValueB] = componentThatReadsAndWritesAtom(
    myAtom({default: 'default', secondParam: 'superset'}),
  );
  const container = renderElements(
    <>
      <Component />
      <ComponentB />
    </>,
  );

  expect(container.textContent).toBe('"default""default"');
  act(() => setValue('set value'));
  expect(container.textContent).toBe('"set value""default"');
  act(() => resetValue());
  expect(container.textContent).toBe('"default""default"');
  act(() => setValue('set value A'));
  expect(container.textContent).toBe('"set value A""default"');
  act(() => setValueB('set value B'));
  expect(container.textContent).toBe('"set value A""set value B"');
  act(() => resetValueB());
  expect(container.textContent).toBe('"set value A""default"');
});

testRecoil('useResetRecoilState - selector', () => {
  const myAtom = atom({
    key: 'useResetRecoilState/selector/atom',
    default: 'default',
  });
  const mySelector = selector({
    key: 'useResetRecoilState/selector',
    get: ({get}) => get(myAtom),
    set: ({set}, value) => set(myAtom, value),
  });

  const [Component, setValue, resetValue] =
    componentThatReadsAndWritesAtom(mySelector);
  const container = renderElements(<Component />);
  expect(container.textContent).toBe('"default"');
  act(() => setValue('set value'));
  expect(container.textContent).toBe('"set value"');
  act(() => resetValue());
  expect(container.textContent).toBe('"default"');
});

testRecoil('useResetRecoilState - parameterized selector', () => {
  const myAtom = atom({
    key: 'useResetRecoilState/parameterized_selector/atom',
    default: 'default',
  });
  const mySelector = selectorFamily({
    key: 'useResetRecoilState/parameterized_selector',
    get:
      () =>
      ({get}) =>
        get(myAtom),
    set:
      () =>
      ({set}, value) =>
        set(myAtom, value),
  });

  const [Component, setValue, resetValue] = componentThatReadsAndWritesAtom(
    mySelector('parameter'),
  );
  const container = renderElements(<Component />);
  expect(container.textContent).toBe('"default"');
  act(() => setValue('set value'));
  expect(container.textContent).toBe('"set value"');
  act(() => resetValue());
  expect(container.textContent).toBe('"default"');
});
