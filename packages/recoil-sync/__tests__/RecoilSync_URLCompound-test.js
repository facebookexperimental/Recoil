/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {act} = require('ReactTestUtils');
const {DefaultValue, atom, atomFamily} = require('Recoil');

const {
  encodeURL,
  expectURL,
  gotoURL,
} = require('../__test_utils__/RecoilSync_MockURLSerialization');
const {syncEffect} = require('../RecoilSync');
const {RecoilURLSyncJSON} = require('../RecoilSync_URLJSON');
const React = require('react');
const {
  componentThatReadsAndWritesAtom,
  renderElements,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');
const {assertion, dict, nullable, number, string} = require('refine');

test('Upgrade item ID', async () => {
  const loc = {part: 'queryParams'};

  const myAtom = atom({
    key: 'recoil-url-sync upgrade itemID',
    default: 'DEFAULT',
    effects_UNSTABLE: [
      syncEffect({
        refine: string(),
        itemKey: 'new_key',
        read: ({read}) => read('old_key') ?? read('new_key'),
      }),
    ],
  });

  history.replaceState(null, '', encodeURL([[loc, {old_key: 'OLD'}]]));

  const [Atom, setAtom, resetAtom] = componentThatReadsAndWritesAtom(myAtom);
  const container = renderElements(
    <>
      <RecoilURLSyncJSON location={loc} />
      <Atom />
    </>,
  );

  // Test that we can load based on old key
  expect(container.textContent).toEqual('"OLD"');

  // Test that we can save to the new key
  act(() => setAtom('NEW'));
  expect(container.textContent).toEqual('"NEW"');
  expectURL([[loc, {new_key: 'NEW'}]]);

  // Test that we can reset the atom and get the default instead of the old key's value
  act(resetAtom);
  expect(container.textContent).toEqual('"DEFAULT"');
  expectURL([[loc, {}]]);
});

test('Many items to one atom', async () => {
  const loc = {part: 'queryParams'};

  const manyToOneSyncEffct = () =>
    syncEffect({
      refine: dict(nullable(number())),
      read: ({read}) => ({foo: read('foo'), bar: read('bar')}),
      write: ({write, reset}, newValue) => {
        if (newValue instanceof DefaultValue) {
          reset('foo');
          reset('bar');
          return;
        }
        for (const key of Object.keys(newValue)) {
          write(key, newValue[key]);
        }
      },
    });

  const myAtom = atom({
    key: 'recoil-url-sync many-to-one',
    default: {},
    effects_UNSTABLE: [manyToOneSyncEffct()],
  });

  history.replaceState(null, '', encodeURL([[loc, {foo: 1}]]));

  const [Atom, setAtom, resetAtom] = componentThatReadsAndWritesAtom(myAtom);
  const container = renderElements(
    <>
      <RecoilURLSyncJSON location={loc} />
      <Atom />
    </>,
  );

  // Test initialize value from URL
  expect(container.textContent).toBe('{"foo":1}');

  // Test subscribe to URL updates
  gotoURL([[loc, {foo: 1, bar: 2}]]);
  expect(container.textContent).toBe('{"bar":2,"foo":1}');

  // Test mutating atoms will update URL
  act(() => setAtom({foo: 3, bar: 4}));
  expectURL([[loc, {foo: 3, bar: 4}]]);

  // Test reseting atoms will update URL
  act(resetAtom);
  expectURL([[loc, {}]]);
});

test('One item to multiple atoms', async () => {
  const loc = {part: 'queryParams'};
  const input = assertion(dict(nullable(number())));

  const oneToManySyncEffect = (prop: string) =>
    syncEffect({
      refine: nullable(number()),
      read: ({read}) => input(read('compound'))[prop],
      write: ({write, read}, newValue) => {
        const compound = {...input(read('compound'))};
        if (newValue instanceof DefaultValue) {
          delete compound[prop];
          return write('compound', compound);
        }
        return write('compound', {...compound, [prop]: newValue});
      },
    });

  const fooAtom = atom({
    key: 'recoil-url-sync one-to-many foo',
    default: 0,
    effects_UNSTABLE: [oneToManySyncEffect('foo')],
  });

  const barAtom = atom({
    key: 'recoil-url-sync one-to-many bar',
    default: null,
    effects_UNSTABLE: [oneToManySyncEffect('bar')],
  });

  history.replaceState(null, '', encodeURL([[loc, {compound: {foo: 1}}]]));

  const [Foo, setFoo, resetFoo] = componentThatReadsAndWritesAtom(fooAtom);
  const [Bar, setBar, resetBar] = componentThatReadsAndWritesAtom(barAtom);
  const container = renderElements(
    <>
      <RecoilURLSyncJSON location={loc} />
      <Foo />
      <Bar />
    </>,
  );

  // Test initialize value from URL
  expect(container.textContent).toBe('1null');

  // Test subscribe to URL updates
  gotoURL([[loc, {compound: {foo: 1, bar: 2}}]]);
  expect(container.textContent).toBe('12');

  // Test mutating atoms will update URL
  act(() => setFoo(3));
  expect(container.textContent).toBe('32');
  expectURL([[loc, {compound: {foo: 3, bar: 2}}]]);
  act(() => setBar(4));
  expect(container.textContent).toBe('34');
  expectURL([[loc, {compound: {foo: 3, bar: 4}}]]);

  // Test reseting atoms will update URL
  act(resetFoo);
  expect(container.textContent).toBe('04');
  expectURL([[loc, {compound: {bar: 4}}]]);
  act(resetBar);
  expect(container.textContent).toBe('0null');
  expectURL([[loc, {compound: {}}]]);
});

test('One item to atom family', async () => {
  const loc = {part: 'queryParams'};
  const input = assertion(dict(nullable(number())));

  const oneToFamilyEffect = (prop: string) =>
    syncEffect({
      refine: nullable(number()),
      read: ({read}) => input(read('compound'))[prop],
      write: ({write, read}, newValue) => {
        const compound = {...input(read('compound'))};
        if (newValue instanceof DefaultValue) {
          delete compound[prop];
          return write('compound', compound);
        }
        return write('compound', {...compound, [prop]: newValue});
      },
    });

  const myAtoms = atomFamily({
    key: 'recoil-rul-sync one-to-family',
    default: null,
    effects_UNSTABLE: prop => [oneToFamilyEffect(prop)],
  });

  history.replaceState(null, '', encodeURL([[loc, {compound: {foo: 1}}]]));

  const [Foo, setFoo, resetFoo] = componentThatReadsAndWritesAtom(
    myAtoms('foo'),
  );
  const [Bar, setBar, resetBar] = componentThatReadsAndWritesAtom(
    myAtoms('bar'),
  );
  const container = renderElements(
    <>
      <RecoilURLSyncJSON location={loc} />
      <Foo />
      <Bar />
    </>,
  );

  // Test initialize value from URL
  expect(container.textContent).toBe('1null');

  // Test subscribe to URL updates
  gotoURL([[loc, {compound: {foo: 1, bar: 2}}]]);
  expect(container.textContent).toBe('12');

  // Test mutating atoms will update URL
  act(() => setFoo(3));
  expect(container.textContent).toBe('32');
  expectURL([[loc, {compound: {foo: 3, bar: 2}}]]);
  act(() => setBar(4));
  expect(container.textContent).toBe('34');
  expectURL([[loc, {compound: {foo: 3, bar: 4}}]]);

  // Test reseting atoms will update URL
  act(resetFoo);
  expect(container.textContent).toBe('null4');
  expectURL([[loc, {compound: {bar: 4}}]]);
  act(resetBar);
  expect(container.textContent).toBe('nullnull');
  expectURL([[loc, {compound: {}}]]);
});
