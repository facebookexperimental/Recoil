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
  MockPayloadGenerator,
  stringAtom,
  testFeedbackQuery,
  testFeedbackSubscription,
  testFeedbackMutation,
  mockRelayEnvironment,
  graphQLSelector,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  flushPromisesAndTimers;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');

  ({act} = require('ReactTestUtils'));
  ({MockPayloadGenerator} = require('relay-test-utils'));
  ({
    ReadsAtom,
    componentThatReadsAndWritesAtom,
    flushPromisesAndTimers,
    stringAtom,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  mockRelayEnvironment = require('../__test_utils__/RecoilRelay_mockRelayEnvironment');
  ({
    testFeedbackQuery,
    testFeedbackMutation,
    testFeedbackSubscription,
  } = require('./mock-graphql/RecoilRelay_MockQueries'));

  graphQLSelector = require('../RecoilRelay_graphQLSelector');
});

// Sanity test for graphQLSelector(), which is just a wrapper.
// Most functionality is test as part of graphQLSelectorFamily()
testRecoil('Sanity Query', async () => {
  const {environment, renderElements} = mockRelayEnvironment();

  const myAtom = stringAtom();

  const query = graphQLSelector({
    key: 'graphql derived state',
    environment,
    query: testFeedbackQuery,
    variables: ({get}) => ({id: 'ID-' + get(myAtom)}),
    mapResponse: ({feedback}, {get, variables}) => {
      expect(variables).toEqual({id: 'ID-' + get(myAtom)});
      return `${feedback?.id ?? ''}:${get(myAtom)}-${
        feedback?.seen_count ?? ''
      }`;
    },
    mutations: {
      mutation: testFeedbackMutation,
      variables: count => ({
        data: {feedback_id: 'ID', actor_id: count?.toString()},
      }),
    },
  });

  const [Atom, setAtom] = componentThatReadsAndWritesAtom(query);
  const c = renderElements(<Atom />);
  expect(c.textContent).toBe('loading');

  act(() =>
    environment.mock.resolveMostRecentOperation(operation =>
      MockPayloadGenerator.generate(operation, {
        ID: () => operation.request.variables.id,
        Feedback: () => ({seen_count: 123}),
      }),
    ),
  );
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('"ID-DEFAULT:DEFAULT-123"');

  act(() => setAtom('SET'));
  expect(c.textContent).toBe('"SET"');
  expect(
    environment.mock.getMostRecentOperation().request.variables.data,
  ).toEqual({feedback_id: 'ID', actor_id: 'SET'});
});

testRecoil('Sanity Subscription', async () => {
  const {environment, renderElements} = mockRelayEnvironment();

  const query = graphQLSelector({
    key: 'graphql remote subscription',
    environment,
    query: testFeedbackSubscription,
    variables: {input: {feedback_id: 'ID'}},
    mapResponse: ({feedback_like_subscribe}) =>
      feedback_like_subscribe?.feedback?.seen_count,
  });

  const c = renderElements(<ReadsAtom atom={query} />);
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('loading');

  const operation = environment.mock.getMostRecentOperation();

  act(() =>
    environment.mock.nextValue(
      operation,
      MockPayloadGenerator.generate(operation, {
        ID: () => operation.request.variables.input.feedback_id,
        Feedback: () => ({seen_count: 123}),
      }),
    ),
  );
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('123');

  act(() =>
    environment.mock.nextValue(
      operation,
      MockPayloadGenerator.generate(operation, {
        ID: () => operation.request.variables.input.feedback_id,
        Feedback: () => ({seen_count: 456}),
      }),
    ),
  );
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('456');

  act(() =>
    environment.mock.nextValue(
      operation,
      MockPayloadGenerator.generate(operation, {
        ID: () => operation.request.variables.input.feedback_id,
        Feedback: () => ({seen_count: 789}),
      }),
    ),
  );
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('789');
});
