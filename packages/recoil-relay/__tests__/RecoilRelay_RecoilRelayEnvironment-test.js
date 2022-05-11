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
  atomFamily,
  useRelayEnvironment,
  graphQLSelectorFamily,
  RecoilRelayEnvironmentProvider,
  flushPromisesAndTimers;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({useState} = require('react'));
  ({atomFamily} = require('Recoil'));
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
