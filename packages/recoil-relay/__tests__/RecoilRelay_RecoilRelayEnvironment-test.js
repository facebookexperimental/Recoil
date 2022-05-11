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
  createMockEnvironment,
  testFeedbackQuery,
  graphQLQueryEffect,
  EnvironmentKey,
  ReadsAtom,
  ErrorBoundary,
  renderRecoilElements,
  useState,
  atom,
  atomFamily,
  useRelayEnvironment,
  graphQLSelectorFamily,
  RecoilRelayEnvironment,
  RecoilRelayEnvironmentProvider,
  flushPromisesAndTimers;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({useState} = require('react'));
  ({atom, atomFamily} = require('Recoil'));
  ({useRelayEnvironment} = require('react-relay'));

  ({act} = require('ReactTestUtils'));
  ({MockPayloadGenerator, createMockEnvironment} = require('relay-test-utils'));
  ({
    ReadsAtom,
    flushPromisesAndTimers,
    ErrorBoundary,
    renderElements: renderRecoilElements,
  } = require('recoil-shared/__test_utils__/Recoil_TestingUtils'));
  ({testFeedbackQuery} = require('./mock-graphql/RecoilRelay_MockQueries'));

  ({
    EnvironmentKey,
    RecoilRelayEnvironment,
    RecoilRelayEnvironmentProvider,
  } = require('../RecoilRelay_Environments'));
  graphQLSelectorFamily = require('../RecoilRelay_graphQLSelectorFamily');
  graphQLQueryEffect = require('../RecoilRelay_graphQLQueryEffect');
});

describe('Multiple Environments', () => {
  testRecoil('graphQLQueryEffect()', async () => {
    const environmentA = createMockEnvironment();
    const environmentB = createMockEnvironment();
    const envA = new EnvironmentKey('A');
    const envB = new EnvironmentKey('B');

    const myAtoms = atomFamily<?number, string>({
      key: 'graphql multiple environments',
      effects: id => [
        graphQLQueryEffect({
          environment: id === 'A' ? envA : envB,
          query: testFeedbackQuery,
          variables: {id},
          mapResponse: ({feedback}) => feedback?.seen_count,
        }),
      ],
    });

    function AssertEnvironment({environment}) {
      expect(environment).toBe(useRelayEnvironment());
      return null;
    }

    let swapEnvironments;
    function RegisterRelayEnvironments({children}) {
      const [changeEnv, setChangeEnv] = useState(false);
      swapEnvironments = () => setChangeEnv(true);
      return (
        <RecoilRelayEnvironmentProvider
          environment={changeEnv ? environmentB : environmentA}
          environmentKey={envA}>
          <RecoilRelayEnvironmentProvider
            environment={changeEnv ? environmentA : environmentB}
            environmentKey={envB}>
            <AssertEnvironment
              environment={changeEnv ? environmentA : environmentB}
            />
            {children}
          </RecoilRelayEnvironmentProvider>
        </RecoilRelayEnvironmentProvider>
      );
    }

    const c = renderRecoilElements(
      <ErrorBoundary fallback={e => e.message}>
        <RegisterRelayEnvironments>
          <ReadsAtom atom={myAtoms('A')} />
          <ReadsAtom atom={myAtoms('B')} />
        </RegisterRelayEnvironments>
      </ErrorBoundary>,
    );
    expect(c.textContent).toBe('loading');

    act(() =>
      environmentA.mock.resolveMostRecentOperation(operation =>
        MockPayloadGenerator.generate(operation, {
          Feedback: () => ({seen_count: 123}),
        }),
      ),
    );
    act(() =>
      environmentB.mock.resolveMostRecentOperation(operation =>
        MockPayloadGenerator.generate(operation, {
          Feedback: () => ({seen_count: 456}),
        }),
      ),
    );
    await flushPromisesAndTimers();
    expect(c.textContent).toBe('123456');

    act(swapEnvironments);
    expect(c.textContent).toEqual(expect.stringContaining('EnvironmentKey'));
  });

  testRecoil('graphQLSelectorFamily', async () => {
    const environmentA = createMockEnvironment();
    const environmentB = createMockEnvironment();
    const envA = new EnvironmentKey('A');
    const envB = new EnvironmentKey('B');

    const queryA = graphQLSelectorFamily({
      key: 'graphql multiple environments A',
      environment: envA,
      query: testFeedbackQuery,
      variables: id => ({id}),
      mapResponse: data => data.feedback?.seen_count,
    });

    const queryB = graphQLSelectorFamily({
      key: 'graphql multiple environments B',
      environment: envB,
      query: testFeedbackQuery,
      variables: id => ({id}),
      mapResponse: data => data.feedback?.seen_count,
    });

    function AssertEnvironment({environment}) {
      expect(environment).toBe(useRelayEnvironment());
      return null;
    }

    let swapEnvironments;
    function RegisterRelayEnvironments({children}) {
      const [changeEnv, setChangeEnv] = useState(false);
      swapEnvironments = () => setChangeEnv(true);
      return (
        <RecoilRelayEnvironmentProvider
          environment={changeEnv ? environmentB : environmentA}
          environmentKey={envA}>
          <RecoilRelayEnvironmentProvider
            environment={changeEnv ? environmentA : environmentB}
            environmentKey={envB}>
            <AssertEnvironment
              environment={changeEnv ? environmentA : environmentB}
            />
            {children}
          </RecoilRelayEnvironmentProvider>
        </RecoilRelayEnvironmentProvider>
      );
    }

    const c = renderRecoilElements(
      <ErrorBoundary fallback={e => e.message}>
        <RegisterRelayEnvironments>
          <ReadsAtom atom={queryA('ID')} />
          <ReadsAtom atom={queryB('ID')} />
        </RegisterRelayEnvironments>
      </ErrorBoundary>,
    );
    expect(c.textContent).toBe('loading');

    act(() =>
      environmentA.mock.resolveMostRecentOperation(operation =>
        MockPayloadGenerator.generate(operation, {
          Feedback: () => ({seen_count: 123}),
        }),
      ),
    );
    act(() =>
      environmentB.mock.resolveMostRecentOperation(operation =>
        MockPayloadGenerator.generate(operation, {
          Feedback: () => ({seen_count: 456}),
        }),
      ),
    );
    await flushPromisesAndTimers();
    expect(c.textContent).toBe('123456');

    act(swapEnvironments);
    expect(c.textContent).toEqual(expect.stringContaining('EnvironmentKey'));
  });
});

// Confirm there is no memory leak by releasing Relay environments
testRecoil('Relay environment is unloaded', async () => {
  const environment = createMockEnvironment();
  const enviornmentKey = new EnvironmentKey('env');

  const queryA = atom({
    key: 'graphql query preloaded 1',
    effects: [
      graphQLQueryEffect({
        environment: enviornmentKey,
        query: testFeedbackQuery,
        variables: {id: 'ID'},
        subscribeToLocalMutations_UNSTABLE: false,
      }),
    ],
  });
  const queryB = atom({
    key: 'graphql query preloaded 2',
    effects: [
      graphQLQueryEffect({
        environment: enviornmentKey,
        query: testFeedbackQuery,
        variables: {id: 'ID'},
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

  let unmountEnvironment, issueNewQuery;
  function Component() {
    const [unmount, setUnmount] = useState(false);
    const [newQuery, setNewQuery] = useState(false);
    unmountEnvironment = () => setUnmount(true);
    issueNewQuery = () => setNewQuery(true);
    return unmount ? (
      newQuery ? (
        <ErrorBoundary fallback={e => e.message}>
          <ReadsAtom atom={queryB} />
        </ErrorBoundary>
      ) : (
        <div />
      )
    ) : (
      <RecoilRelayEnvironment
        environment={environment}
        environmentKey={enviornmentKey}>
        <ReadsAtom atom={queryA} />
      </RecoilRelayEnvironment>
    );
  }
  const c = renderRecoilElements(<Component />);
  // Confirm data is available synchronously with the first render
  expect(c.textContent).toBe('{"feedback":{"id":"ID","seen_count":123}}');

  // Unmount <RecoilRelayEnvironment> and give it a chance to cleanup
  act(unmountEnvironment);
  await flushPromisesAndTimers();

  // Confirm environment is not retained and an error is thrown with query attempt
  act(issueNewQuery);
  expect(c.textContent).toEqual(
    expect.stringContaining('RecoilRelayEnvironment'),
  );
});
