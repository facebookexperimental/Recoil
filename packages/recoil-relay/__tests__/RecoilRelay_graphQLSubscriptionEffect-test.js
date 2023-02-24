/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
  testFeedbackSubscription,
  mockRelayEnvironment,
  MockPayloadGenerator,
  atomFamily,
  graphQLSubscriptionEffect,
  ReadsAtom,
  flushPromisesAndTimers;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({atomFamily} = require('Recoil'));

  ({act} = require('ReactTestUtils'));
  ({
    ReadsAtom,
    flushPromisesAndTimers,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  ({MockPayloadGenerator} = require('relay-test-utils'));
  mockRelayEnvironment = require('../__test_utils__/RecoilRelay_mockRelayEnvironment');
  ({
    testFeedbackSubscription,
  } = require('./mock-graphql/RecoilRelay_MockQueries'));

  graphQLSubscriptionEffect = require('../RecoilRelay_graphQLSubscriptionEffect');
});

testRecoil('GraphQL Subscription', async () => {
  const {environment, renderElements} = mockRelayEnvironment();

  const query = atomFamily({
    key: 'graphql remote subscription',
    // $FlowFixMe[missing-local-annot]
    effects: ({id}) => [
      graphQLSubscriptionEffect({
        environment,
        subscription: testFeedbackSubscription,
        variables: {input: {feedback_id: id}},
        mapResponse: ({feedback_like_subscribe}) =>
          feedback_like_subscribe?.feedback?.seen_count,
      }),
    ],
  });

  const c = renderElements(<ReadsAtom atom={query({id: 'ID'})} />);
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
