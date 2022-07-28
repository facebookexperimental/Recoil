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
  MockPayloadGenerator,
  mockRelayEnvironment,
  testFeedbackMutation,
  atom,
  graphQLMutationEffect,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({atom} = require('Recoil'));

  ({act} = require('ReactTestUtils'));
  ({MockPayloadGenerator} = require('relay-test-utils'));
  ({
    componentThatReadsAndWritesAtom,
    flushPromisesAndTimers,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  mockRelayEnvironment = require('../__test_utils__/RecoilRelay_mockRelayEnvironment');
  ({testFeedbackMutation} = require('./mock-graphql/RecoilRelay_MockQueries'));

  graphQLMutationEffect = require('../RecoilRelay_graphQLMutationEffect');
});

// Test that mutating an atom will commit a mutation operation
testRecoil('Atom Mutation', async () => {
  const {environment, renderElements} = mockRelayEnvironment();

  const myAtom = atom({
    key: 'graphql atom mutation',
    default: 'DEFAULT',
    effects: [
      graphQLMutationEffect({
        environment,
        mutation: testFeedbackMutation,
        variables: actor_id => ({data: {feedback_id: 'ID', actor_id}}),
      }),
    ],
  });

  const [ReadAtom, setAtom, resetAtom] =
    componentThatReadsAndWritesAtom(myAtom);
  const c = renderElements(<ReadAtom />);
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('"DEFAULT"');

  act(() => setAtom('SET'));
  expect(c.textContent).toBe('"SET"');

  expect(
    environment.mock.getMostRecentOperation().request.variables.data,
  ).toEqual({feedback_id: 'ID', actor_id: 'SET'});

  // Mutation error reverts atom to previous value.
  act(() =>
    environment.mock.rejectMostRecentOperation(() => new Error('ERROR')),
  );
  expect(c.textContent).toBe('"DEFAULT"');

  // Rejecting a previous set won't revert the value.
  act(() => setAtom('SET2'));
  expect(c.textContent).toBe('"SET2"');
  act(() => setAtom('SET3'));
  expect(c.textContent).toBe('"SET3"');
  expect(environment.mock.getAllOperations().length).toBe(2);
  act(() =>
    environment.mock.reject(
      environment.mock.getAllOperations()[0],
      new Error('ERROR2'),
    ),
  );
  expect(c.textContent).toBe('"SET3"');

  // Reset atom
  act(resetAtom);
  expect(c.textContent).toBe('"DEFAULT"');
  expect(
    environment.mock.getMostRecentOperation().request.variables.data,
  ).toEqual({feedback_id: 'ID', actor_id: 'DEFAULT'});
});

testRecoil('Updaters', async () => {
  const {environment, renderElements} = mockRelayEnvironment();

  const updater = jest.fn((store, data) => {
    expect(data?.feedback_like?.feedback?.id).toEqual('ID');
    expect(data?.feedback_like?.liker?.id).toEqual('ACTOR');

    const feedback = store.get('ID');
    expect(feedback?.getValue('id')).toBe('ID');
    const liker = store.get('ACTOR');
    expect(liker?.getValue('id')).toBe('ACTOR');
  });

  const optimisticUpdater = jest.fn((store, data) => {
    expect(data?.feedback_like?.feedback?.id).toEqual('ID');
    expect(data?.feedback_like?.liker?.id).toEqual('OPTIMISTIC_SET');

    const feedback = store.get('ID');
    expect(feedback?.getValue('id')).toBe('ID');
    const liker = store.get('OPTIMISTIC_SET');
    expect(liker?.getValue('id')).toBe('OPTIMISTIC_SET');
  });

  const myAtom = atom({
    key: 'graphql atom mutation updater',
    default: 'DEFAULT',
    effects: [
      graphQLMutationEffect({
        environment,
        mutation: testFeedbackMutation,
        variables: actor_id => ({data: {feedback_id: 'ID', actor_id}}),
        updater_UNSTABLE: updater,
        optimisticUpdater_UNSTABLE: optimisticUpdater,
        optimisticResponse_UNSTABLE: actor_id => ({
          feedback_like: {
            feedback: {id: 'ID'},
            liker: {id: 'OPTIMISTIC_' + actor_id, __typename: 'Actor'},
          },
        }),
      }),
    ],
  });

  const [ReadAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);
  const c = renderElements(<ReadAtom />);
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('"DEFAULT"');

  act(() => setAtom('SET'));
  expect(c.textContent).toBe('"SET"');

  expect(
    environment.mock.getMostRecentOperation().request.variables.data,
  ).toEqual({feedback_id: 'ID', actor_id: 'SET'});

  act(() =>
    environment.mock.resolveMostRecentOperation(operation =>
      MockPayloadGenerator.generate(operation, {
        Feedback: () => ({id: 'ID'}),
        Actor: () => ({id: 'ACTOR'}),
      }),
    ),
  );
  expect(c.textContent).toBe('"SET"'); // Errors in updaters will revert value
  expect(optimisticUpdater).toHaveBeenCalledTimes(1);
  expect(updater).toHaveBeenCalledTimes(1);
});

testRecoil('Aborted mutation', async () => {
  const {environment, renderElements} = mockRelayEnvironment();

  const myAtom = atom({
    key: 'graphql atom mutation abort',
    default: 'DEFAULT',
    effects: [
      graphQLMutationEffect({
        environment,
        mutation: testFeedbackMutation,
        variables: () => null,
      }),
    ],
  });

  const [ReadAtom, setAtom] = componentThatReadsAndWritesAtom(myAtom);
  const c = renderElements(<ReadAtom />);
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('"DEFAULT"');

  act(() => setAtom('SET'));
  expect(c.textContent).toBe('"SET"');
  expect(environment.mock.getAllOperations().length).toBe(0);
});
