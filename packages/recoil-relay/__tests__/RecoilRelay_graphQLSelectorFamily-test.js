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

import type {
  RecoilRelayMockQueriesFeedbackQuery$data,
  RecoilRelayMockQueriesFeedbackQuery$variables,
} from 'RecoilRelayMockQueriesFeedbackQuery.graphql';
import type {
  RecoilRelayMockQueriesMutation$data,
  RecoilRelayMockQueriesMutation$rawResponse,
  RecoilRelayMockQueriesMutation$variables,
} from 'RecoilRelayMockQueriesMutation.graphql';

const {
  getRecoilTestFn,
} = require('recoil-shared/__test_utils__/Recoil_TestingUtils');

let React,
  act,
  MockPayloadGenerator,
  stringAtom,
  testFeedbackQuery,
  testFeedbackMutation,
  mockRelayEnvironment,
  graphQLSelectorFamily,
  ReadsAtom,
  componentThatReadsAndWritesAtom,
  useState,
  useRecoilCallback,
  flushPromisesAndTimers;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({useState} = require('react'));
  ({useRecoilCallback} = require('Recoil'));

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
  } = require('./mock-graphql/RecoilRelay_MockQueries'));

  graphQLSelectorFamily = require('../RecoilRelay_graphQLSelectorFamily');
});

testRecoil('Relay Query with <RecoilRoot>', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    RecoilRelayMockQueriesFeedbackQuery$variables,
  >({
    key: 'graphql query',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    variables: vars => vars,
    mapResponse: data => data,
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

testRecoil('Relay Query with Snapshot Preloaded', async () => {
  const {environment, mockEnvironmentKey, snapshot} = mockRelayEnvironment();

  environment.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      ID: () => operation.request.variables.id,
      Feedback: () => ({seen_count: 123}),
    }),
  );
  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    RecoilRelayMockQueriesFeedbackQuery$variables,
  >({
    key: 'graphql snapshot query preloaded',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    variables: vars => vars,
    mapResponse: data => data,
  });

  expect(snapshot.getLoadable(query({id: 'ID'})).getValue()).toEqual({
    feedback: {id: 'ID', seen_count: 123},
  });
});

testRecoil('Relay Query Error with <RecoilRoot>', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    RecoilRelayMockQueriesFeedbackQuery$variables,
  >({
    key: 'graphql query error',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    variables: vars => vars,
    mapResponse: data => data,
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

  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    RecoilRelayMockQueriesFeedbackQuery$variables,
  >({
    key: 'graphql snapshot query error',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    variables: vars => vars,
    mapResponse: data => data,
  });

  expect(snapshot.getLoadable(query({id: 'ID'})).state).toBe('loading');

  act(() => environment.mock.rejectMostRecentOperation(new Error('ERROR')));
  await flushPromisesAndTimers();
  expect(() => snapshot.getLoadable(query({id: 'ID'})).getValue()).toThrow(
    'ERROR',
  );
});

testRecoil('Relay Query that is already loaded', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    void,
  >({
    key: 'graphql query preloaded',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    variables: {id: 'ID'},
    mapResponse: data => data,
  });

  environment.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      ID: () => operation.request.variables.id,
      Feedback: () => ({seen_count: 123}),
    }),
  );

  const c = renderElements(<ReadsAtom atom={query()} />);
  await flushPromisesAndTimers();
  expect(c.textContent).toBe('{"feedback":{"id":"ID","seen_count":123}}');
});

testRecoil('Relay Query Deferred', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    RecoilRelayMockQueriesFeedbackQuery$variables,
  >({
    key: 'graphql query deferred',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    variables: vars => vars,
    mapResponse: data => data,
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

  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    string,
    ?number,
  >({
    key: 'graphql mapResponse',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    variables: id => ({id}),
    mapResponse:
      (data, {variables}) =>
      id => {
        expect(variables).toEqual({id});
        return data.feedback?.seen_count;
      },
  });

  const c = renderElements(<ReadsAtom atom={query('ID')} />);
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

testRecoil('Using derived state', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const myAtom = stringAtom();

  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    string,
    string,
  >({
    key: 'graphql derived state',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    variables:
      id =>
      ({get}) => ({id: id + '-' + get(myAtom)}),
    mapResponse:
      ({feedback}, {get}) =>
      id =>
        `${id}=${feedback?.id ?? ''}:${get(myAtom)}-${
          feedback?.seen_count ?? ''
        }`,
  });

  const c = renderElements(<ReadsAtom atom={query('ID')} />);
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
  expect(c.textContent).toBe('"ID=ID-DEFAULT:DEFAULT-123"');
});

testRecoil('null variables', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    RecoilRelayMockQueriesFeedbackQuery$variables | null,
    RecoilRelayMockQueriesFeedbackQuery$data,
  >({
    key: 'graphql null variables',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    variables: vars => vars,
    mapResponse: data => data,
  });

  const c = renderElements(<ReadsAtom atom={query(null)} />);
  expect(c.textContent).toBe('loading');
  expect(environment.mock.getAllOperations().length).toBe(0);
});

testRecoil('null variables with default', async () => {
  const {environment, mockEnvironmentKey, renderElements} =
    mockRelayEnvironment();

  const query = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    string,
    RecoilRelayMockQueriesFeedbackQuery$data | string,
  >({
    key: 'graphql null variables with default',
    environment: mockEnvironmentKey,
    query: testFeedbackQuery,
    default: id => 'DEFAULT-' + id,
    variables: () => null,
    mapResponse: data => data,
  });

  const c = renderElements(<ReadsAtom atom={query('ID')} />);
  expect(c.textContent).toBe('"DEFAULT-ID"');
  expect(environment.mock.getAllOperations().length).toBe(0);
});

testRecoil('pre-fetch query', async () => {
  const {environment, renderElements} = mockRelayEnvironment();

  const myQuery = graphQLSelectorFamily<
    RecoilRelayMockQueriesFeedbackQuery$variables,
    RecoilRelayMockQueriesFeedbackQuery$data,
    string,
    ?number,
  >({
    key: 'graphql prefetch',
    environment,
    query: testFeedbackQuery,
    variables: id => ({id}),
    mapResponse: data => id => {
      expect(data.feedback?.id).toBe(id);
      return data.feedback?.seen_count;
    },
  });

  let setID;
  function Component() {
    const [id, setIDState] = useState('ID1');
    // $FlowFixMe[missing-local-annot]
    setID = useRecoilCallback(({snapshot}) => async newID => {
      // Pre-fetch the query
      // $FlowFixMe[unused-promise]
      snapshot.getPromise(myQuery(newID));

      // Mock the query response
      environment.mock.resolveMostRecentOperation(operation =>
        MockPayloadGenerator.generate(operation, {
          ID: () => operation.request.variables.id,
          Feedback: () => ({seen_count: 456}),
        }),
      );
      await flushPromisesAndTimers();

      // Actually update the state to the new ID
      setIDState(newID);
    });

    return (
      <>
        {id} -{' '}
        <React.Suspense fallback="ERROR - ATOM IS NOT PREFETCHED">
          <ReadsAtom atom={myQuery(id)} />
        </React.Suspense>
      </>
    );
  }

  environment.mock.queueOperationResolver(operation =>
    MockPayloadGenerator.generate(operation, {
      ID: () => operation.request.variables.id,
      Feedback: () => ({seen_count: 123}),
    }),
  );

  const c = renderElements(<Component />);
  expect(c.textContent).toBe('ID1 - 123');

  // If atom is not prefetched, then the <Suspense> wrapping it will trigger
  await act(() => setID('ID2'));
  expect(c.textContent).toBe('ID2 - 456');
});

describe('mutations', () => {
  testRecoil('Local cache', async () => {
    const {environment, mockEnvironmentKey, renderElements} =
      mockRelayEnvironment();

    const query = graphQLSelectorFamily<
      RecoilRelayMockQueriesFeedbackQuery$variables,
      RecoilRelayMockQueriesFeedbackQuery$data,
      string,
      ?number,
    >({
      key: 'graphql query local cache',
      environment: mockEnvironmentKey,
      query: testFeedbackQuery,
      variables: id => ({id}),
      mapResponse: data => data.feedback?.seen_count,
    });

    const [Atom, setAtom] = componentThatReadsAndWritesAtom(query('ID'));
    const c = renderElements(<Atom />);
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
    expect(c.textContent).toBe('123');

    // Test that atom can be set as a local cache
    act(() => setAtom(456));
    expect(c.textContent).toBe('456');
    expect(environment.mock.getAllOperations().length).toBe(0);
  });

  testRecoil('Write-through cache', async () => {
    const {environment, mockEnvironmentKey, renderElements} =
      mockRelayEnvironment();

    const query = graphQLSelectorFamily<
      RecoilRelayMockQueriesFeedbackQuery$variables,
      RecoilRelayMockQueriesFeedbackQuery$data,
      string,
      ?string | number,
      _,
      RecoilRelayMockQueriesMutation$variables,
      RecoilRelayMockQueriesMutation$data,
      RecoilRelayMockQueriesMutation$rawResponse,
    >({
      key: 'graphql query write-through cache',
      environment: mockEnvironmentKey,
      query: testFeedbackQuery,
      default: 'DEFAULT',
      variables: id => ({id}),
      mapResponse: data => data.feedback?.seen_count,
      mutations: {
        mutation: testFeedbackMutation,
        variables: count => id => ({
          data: {feedback_id: id, actor_id: count?.toString()},
        }),
      },
    });

    const [Atom, setAtom, resetAtom] = componentThatReadsAndWritesAtom(
      query('ID'),
    );
    const c = renderElements(<Atom />);
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
    expect(c.textContent).toBe('123');

    act(() => setAtom('SET'));
    expect(c.textContent).toBe('"SET"');
    expect(
      environment.mock.getMostRecentOperation().request.variables.data,
    ).toEqual({feedback_id: 'ID', actor_id: 'SET'});

    // Mutation error reverts atom to previous value.
    act(() =>
      environment.mock.rejectMostRecentOperation(() => new Error('ERROR')),
    );
    expect(c.textContent).toBe('123');

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
});
