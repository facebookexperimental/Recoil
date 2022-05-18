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
  mockRelayEnvironment,
  testFeedbackQuery,
  commitLocalUpdate,
  MockPayloadGenerator,
  useState,
  atom,
  atomFamily,
  graphQLQueryEffect,
  ReadsAtom,
  flushPromisesAndTimers;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({useState} = require('react'));
  ({atom, atomFamily} = require('Recoil'));
  ({commitLocalUpdate} = require('react-relay'));

  ({act} = require('ReactTestUtils'));
  ({
    ReadsAtom,
    flushPromisesAndTimers,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  mockRelayEnvironment = require('../__test_utils__/RecoilRelay_mockRelayEnvironment');
  ({testFeedbackQuery} = require('./mock-graphql/RecoilRelay_MockQueries'));
  ({MockPayloadGenerator} = require('relay-test-utils'));

  graphQLQueryEffect = require('../RecoilRelay_graphQLQueryEffect');
});

testRecoil('Relay Query with <RecoilRoot>', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = atomFamily({
    key: 'graphql query',
    default: {feedback: null},
    effects: variables => [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables,
        mapResponse: data => data,
        subscribeToLocalMutations_UNSTABLE: false,
      }),
    ],
  });

  const c = renderElements(<ReadsAtom atom={query({id: 'ID'})} />);
  await flushPromisesAndTimers();
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
  expect(c.textContent).toBe('{"feedback":{"id":"ID","seen_count":123}}');
});

testRecoil('Relay Query with Snapshot', async () => {
  const {environment, mockEnvironmentKey, snapshot} = mockRelayEnvironment();

  const query = atomFamily({
    key: 'graphql snapshot query',
    effects: variables => [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables,
        mapResponse: data => data,
        subscribeToLocalMutations_UNSTABLE: false,
      }),
    ],
  });

  expect(snapshot.getLoadable(query({id: 'ID'})).state).toBe('loading');

  act(() =>
    environment.mock.resolveMostRecentOperation(operation =>
      MockPayloadGenerator.generate(operation, {
        ID: () => operation.request.variables.id,
        Feedback: () => ({seen_count: 123}),
      }),
    ),
  );
  expect(snapshot.getLoadable(query({id: 'ID'})).getValue()).toEqual({
    feedback: {id: 'ID', seen_count: 123},
  });
});

testRecoil('Relay Query Error with <RecoilRoot>', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = atomFamily({
    key: 'graphql query error',
    default: {feedback: null},
    effects: variables => [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables,
        mapResponse: data => data,
        subscribeToLocalMutations_UNSTABLE: false,
      }),
    ],
  });

  const c = renderElements(<ReadsAtom atom={query({id: 'ID'})} />);
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('loading');

  act(() => environment.mock.rejectMostRecentOperation(new Error('ERROR')));
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('error');
});

testRecoil('Relay Query Error with Snapshot', async () => {
  const {environment, mockEnvironmentKey, snapshot} = mockRelayEnvironment();

  const query = atomFamily({
    key: 'graphql snapshot query error',
    effects: variables => [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables,
        mapResponse: data => data,
        subscribeToLocalMutations_UNSTABLE: false,
      }),
    ],
  });

  expect(snapshot.getLoadable(query({id: 'ID'})).state).toBe('loading');

  act(() => environment.mock.rejectMostRecentOperation(new Error('ERROR')));
  await flushPromisesAndTimers();
  expect(() => snapshot.getLoadable(query({id: 'ID'})).getValue()).toThrow(
    'ERROR',
  );
});

testRecoil('Relay Query that is preloaded', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  // Use two atoms to avoid mocking up Entry Points to test preloading.
  // The first atom will consume the queued network resolver in the mock environment
  // The second atom will load from the Relay store cache as a pre-load would.
  const queryA = atom({
    key: 'graphql query preloaded 1',
    effects: [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables: {id: 'ID'},
        mapResponse: data => data,
        subscribeToLocalMutations_UNSTABLE: false,
      }),
    ],
  });
  const queryB = atom({
    key: 'graphql query preloaded 2',
    effects: [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables: {id: 'ID'},
        mapResponse: data => data,
        subscribeToLocalMutations_UNSTABLE: false,
      }),
    ],
  });
  // This third atom will confirm that we can still load the pre-loaded data
  // after subsequent updates.
  const queryC = atom({
    key: 'graphql query preloaded 3',
    effects: [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables: {id: 'ID'},
        mapResponse: data => data,
        subscribeToLocalMutations_UNSTABLE: false,
      }),
    ],
  });

  environment.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      ID: () => operation.request.variables.id,
      Feedback: () => ({seen_count: 123}),
    }),
  );
  environment.mock.queuePendingOperation(testFeedbackQuery, {id: 'ID'});

  let enableQueryC;
  function Component() {
    const [state, setState] = useState(false);
    enableQueryC = () => setState(true);
    return (
      <>
        <ReadsAtom atom={queryA} />
        <ReadsAtom atom={queryB} />
        {state && <ReadsAtom atom={queryC} />}
      </>
    );
  }
  const c = renderElements(<Component />);
  // Confirm data is available synchronously with the first render
  expect(c.textContent).toBe(
    '{"feedback":{"id":"ID","seen_count":123}}{"feedback":{"id":"ID","seen_count":123}}',
  );

  // Confirm data is still synchronously available after updates.
  await flushPromisesAndTimers();
  act(enableQueryC);
  expect(c.textContent).toBe(
    '{"feedback":{"id":"ID","seen_count":123}}{"feedback":{"id":"ID","seen_count":123}}{"feedback":{"id":"ID","seen_count":123}}',
  );
});

// TODO Test with graphQL that actually contains @defer
// TODO Test a "live query"
testRecoil('Relay Query Deferred', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = atomFamily({
    key: 'graphql query deferred',
    default: {mode: {id: 'DEFAULT'}},
    effects: variables => [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables,
        mapResponse: data => data,
        subscribeToLocalMutations_UNSTABLE: false,
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
        ID: () => operation.request.variables.id,
        Feedback: () => ({seen_count: 123}),
      }),
    ),
  );
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('{"feedback":{"id":"ID","seen_count":123}}');

  act(() =>
    environment.mock.nextValue(
      operation,
      MockPayloadGenerator.generate(operation, {
        ID: () => operation.request.variables.id,
        Feedback: () => ({seen_count: 456}),
      }),
    ),
  );
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('{"feedback":{"id":"ID","seen_count":456}}');

  act(() =>
    environment.mock.resolve(
      operation,
      MockPayloadGenerator.generate(operation, {
        ID: () => operation.request.variables.id,
        Feedback: () => ({seen_count: 789}),
      }),
    ),
  );
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('{"feedback":{"id":"ID","seen_count":789}}');
});

testRecoil('mapResponse', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const myAtom = atomFamily<?number, string>({
    key: 'graphql mapResponse',
    effects: id => [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables: {id},
        mapResponse: ({feedback}) => feedback?.seen_count,
      }),
    ],
  });

  const c = renderElements(<ReadsAtom atom={myAtom('ID')} />);
  expect(c.textContent).toBe('loading');

  act(() =>
    environment.mock.resolveMostRecentOperation(operation =>
      MockPayloadGenerator.generate(operation, {
        Feedback: () => ({seen_count: 123}),
      }),
    ),
  );
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('123');
});

testRecoil('null variables', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = atomFamily<?number, ?string>({
    key: 'graphql null variables',
    effects: id => [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables: id != null ? {id} : null,
        mapResponse: ({feedback}) => feedback?.seen_count,
      }),
    ],
  });

  const c = renderElements(<ReadsAtom atom={query(null)} />);
  expect(c.textContent).toBe('loading');
  expect(environment.mock.getAllOperations().length).toBe(0);
});

testRecoil('null variables with default', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = atomFamily<?number, ?string>({
    key: 'graphql null variables with default',
    default: 789,
    effects: id => [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables: id != null ? {id} : null,
        mapResponse: ({feedback}) => feedback?.seen_count,
      }),
    ],
  });

  const c = renderElements(<ReadsAtom atom={query(null)} />);
  expect(c.textContent).toBe('789');
  expect(environment.mock.getAllOperations().length).toBe(0);
});

test('Subscribe to local mutations', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = atomFamily({
    key: 'graphql local subscriptions',
    effects: variables => [
      graphQLQueryEffect({
        environment: mockEnvironmentKey,
        query: testFeedbackQuery,
        variables,
        mapResponse: data => data,
        subscribeToLocalMutations_UNSTABLE: true,
      }),
    ],
  });

  const c = renderElements(<ReadsAtom atom={query({id: 'ID'})} />);
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('loading');

  act(() =>
    environment.mock.resolveMostRecentOperation(operation => {
      return MockPayloadGenerator.generate(operation, {
        ID: () => operation.request.variables.id,
        Feedback: () => ({seen_count: 123}),
      });
    }),
  );
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('{"feedback":{"id":"ID","seen_count":123}}');

  act(() =>
    commitLocalUpdate(environment, store => {
      const feedback = store.get('ID');
      expect(feedback?.getValue('seen_count')).toBe(123);
      feedback?.setValue(456, 'seen_count');
    }),
  );
  expect(c.textContent).toBe('{"feedback":{"id":"ID","seen_count":456}}');
});
