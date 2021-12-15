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
const {
  mutableSourceExists,
} = require('recoil-shared/util/Recoil_mutableSource');

let React,
  act,
  useTransition,
  useRecoilState,
  atom,
  renderElementsInConcurrentRoot,
  flushPromisesAndTimers;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({useTransition} = React);
  ({act} = require('ReactTestUtils'));
  ({useRecoilState, atom} = require('../../Recoil_index'));
  ({
    renderElementsInConcurrentRoot,
    flushPromisesAndTimers,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
});

let nextID = 0;

testRecoil('Works with useTransition', async ({gks}) => {
  // recoil_early_rendering_2021 is currently coupled with recoil_suppress_rerender_in_callback
  if (!gks.includes('recoil_early_rendering_2021')) {
    return;
  }
  if (!mutableSourceExists()) {
    return;
  }

  const indexAtom = atom({
    key: `index${nextID++}`,
    default: 0,
  });

  // Basic implementation of a cache that suspends:
  const cache = new Map();
  const resolvers = [];
  function getItem(index) {
    if (cache.has(index) && cache.get(index)?.state === 'ready') {
      return cache.get(index)?.value;
    } else if (cache.has(index)) {
      throw cache.get(index)?.promise; // eslint-disable-line no-throw-literal
    } else {
      const promise = new Promise(resolve => {
        const onComplete = () => {
          cache.set(index, {
            state: 'ready',
            value: `v${index}`,
            promise: null,
          });
          resolve();
        };
        resolvers.push(onComplete);
      });
      const newEntry = {
        state: 'loading',
        value: null,
        promise,
      };
      cache.set(index, newEntry);
      throw promise;
    }
  }

  function ItemContents({index}) {
    const item = getItem(index);
    return (
      <div>
        Item {index} = {item}
      </div>
    );
  }

  function Item({index}) {
    return (
      <React.Suspense fallback="Suspended">
        <ItemContents index={index} />
      </React.Suspense>
    );
  }

  let incrementIndex;
  function Main() {
    const [index, setIndex] = useRecoilState(indexAtom);
    const [isPending, startTransition] = useTransition();
    incrementIndex = () => {
      startTransition(() => {
        setIndex(x => x + 1);
      });
    };
    return (
      <div>
        Index: {index} - {isPending && 'In transition - '}
        <Item index={index} />
      </div>
    );
  }

  const c = renderElementsInConcurrentRoot(<Main />);

  // Initial load:
  expect(c.textContent).toEqual('Index: 0 - Suspended');
  act(() => resolvers[0]());
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('Index: 0 - Item 0 = v0');

  // Increment index a single time; see previous item in transition, then once
  // the new item resolves, see the new item:
  act(() => incrementIndex());
  expect(c.textContent).toEqual('Index: 0 - In transition - Item 0 = v0');
  act(() => resolvers[1]());
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('Index: 1 - Item 1 = v1');

  // Increment index a second time during transition; see previous item in
  // transition, then once the new _second_ item resolves, see that new item:
  act(() => incrementIndex());
  expect(c.textContent).toEqual('Index: 1 - In transition - Item 1 = v1');
  act(() => incrementIndex());
  expect(c.textContent).toEqual('Index: 1 - In transition - Item 1 = v1');
  act(() => resolvers[2]());
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('Index: 1 - In transition - Item 1 = v1');
  act(() => resolvers[3]());
  await flushPromisesAndTimers();
  expect(c.textContent).toEqual('Index: 3 - Item 3 = v3');
});
