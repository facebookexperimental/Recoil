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

import type {RecoilState} from '../../core/Recoil_RecoilValue';

const {getRecoilTestFn} = require('../../testing/Recoil_TestingUtils');

let React,
  act,
  atom,
  componentThatReadsAndWritesAtom,
  gkx,
  useRecoilValue,
  useRecoilValueLoadable,
  useRetain,
  useRecoilCallback,
  useState,
  selector,
  renderElements,
  retentionZone;

const testRecoil = getRecoilTestFn(() => {
  React = require('react');
  ({useState} = require('react'));

  ({act} = require('ReactTestUtils'));
  ({retentionZone} = require('../../core/Recoil_RetentionZone'));
  ({
    useRecoilValue,
    useRecoilValueLoadable,
    useRetain,
    useRecoilCallback,
  } = require('../../hooks/Recoil_Hooks'));
  atom = require('../../recoil_values/Recoil_atom');
  selector = require('../../recoil_values/Recoil_selector');
  ({
    componentThatReadsAndWritesAtom,
    renderElements,
  } = require('../../testing/Recoil_TestingUtils'));
  gkx = require('../../util/Recoil_gkx');

  const initialGKValue = gkx('recoil_memory_managament_2020');
  gkx.setPass('recoil_memory_managament_2020');
  return () => {
    initialGKValue || gkx.setFail('recoil_memory_managament_2020');
  };
});

let nextKey = 0;
function atomRetainedBy(retainedBy) {
  return atom({
    key: `retention/${nextKey++}`,
    default: 0,
    retainedBy_UNSTABLE: retainedBy,
  });
}

function switchComponent(defaultVisible) {
  let innerSetVisible = _ => undefined;
  const setVisible = v => innerSetVisible(v); // acts like a ref basically
  function Switch({children}) {
    let visible;
    [visible, innerSetVisible] = useState(defaultVisible);
    return visible ? children : null;
  }
  return [Switch, setVisible];
}

// Mounts a component that reads the given atom, sets its value, then unmounts it
// and re-mounts it again. Checks whether the value of the atom that was written
// is still observed. If otherChildren is provided, it will be mounted throughout this,
// then at the end it will be unmounted and the atom expected to be released.
function testWhetherAtomIsRetained(
  shouldBeRetained: boolean,
  atom: RecoilState<number>,
  otherChildren = null,
): void {
  const [AtomSwitch, setAtomVisible] = switchComponent(false);
  const [OtherChildrenSwitch, setOtherChildrenVisible] = switchComponent(false);
  const [ReadsAtomComp, updateAtom] = componentThatReadsAndWritesAtom(atom);

  const container = renderElements(
    <>
      <AtomSwitch>
        <ReadsAtomComp />
      </AtomSwitch>
      <OtherChildrenSwitch>{otherChildren}</OtherChildrenSwitch>
    </>,
  );

  expect(container.textContent).toEqual('');
  act(() => {
    setAtomVisible(true);
    setOtherChildrenVisible(true);
  });
  expect(container.textContent).toEqual('0');
  act(() => updateAtom(1));
  expect(container.textContent).toEqual('1');
  act(() => setAtomVisible(false));
  expect(container.textContent).toEqual('');
  act(() => setAtomVisible(true));
  if (shouldBeRetained) {
    expect(container.textContent).toEqual('1');
  } else {
    expect(container.textContent).toEqual('0');
  }

  if (otherChildren) {
    act(() => {
      setAtomVisible(false);
      setOtherChildrenVisible(false);
    });
    expect(container.textContent).toEqual('');
    act(() => setAtomVisible(true));
    expect(container.textContent).toEqual('0'); // Not expected for root-retained but this doesn't occur in these tests
  }
}

describe('Default retention', () => {
  testRecoil(
    'By default, atoms are retained for the lifetime of the root',
    () => {
      testWhetherAtomIsRetained(true, atomRetainedBy(undefined));
    },
  );
});

describe('Component-level retention', () => {
  testRecoil(
    'With retainedBy: components, atoms are released when not in use',
    () => {
      testWhetherAtomIsRetained(false, atomRetainedBy('components'));
    },
  );

  testRecoil(
    'An atom is retained by a component being subscribed to it',
    () => {
      const anAtom = atomRetainedBy('components');
      function Subscribes() {
        useRecoilValue(anAtom);
        return null;
      }
      testWhetherAtomIsRetained(true, anAtom, <Subscribes />);
    },
  );

  testRecoil(
    'An atom is retained by a component retaining it explicitly',
    () => {
      const anAtom = atomRetainedBy('components');
      function Retains() {
        useRetain(anAtom);
        return null;
      }
      testWhetherAtomIsRetained(true, anAtom, <Retains />);
    },
  );
});

describe('RetentionZone retention', () => {
  testRecoil('An atom can be retained via a retention zone', () => {
    const zone = retentionZone();
    const anAtom = atomRetainedBy(zone);
    function RetainsZone() {
      useRetain(zone);
      return null;
    }
    testWhetherAtomIsRetained(true, anAtom, <RetainsZone />);
  });
});

describe('Retention of and via selectors', () => {
  testRecoil(
    'An atom is retained when a depending selector is retained',
    () => {
      const anAtom = atomRetainedBy('components');
      const aSelector = selector({
        key: '...',
        retainedBy_UNSTABLE: 'components',
        get: ({get}) => {
          return get(anAtom);
        },
      });
      function SubscribesToSelector() {
        useRecoilValue(aSelector);
        return null;
      }
      testWhetherAtomIsRetained(true, anAtom, <SubscribesToSelector />);
    },
  );

  const flushPromises = async () =>
    await act(() => new Promise(window.setImmediate));

  testRecoil(
    'An async selector is not released when its only subscribed component suspends',
    async () => {
      let resolve;
      let evalCount = 0;
      const anAtom = atomRetainedBy('components');
      const aSelector = selector({
        key: '......',
        retainedBy_UNSTABLE: 'components',
        get: ({get}) => {
          evalCount++;
          get(anAtom);
          return new Promise(r => {
            resolve = r;
          });
        },
      });
      function SubscribesToSelector() {
        return useRecoilValue(aSelector);
      }
      const c = renderElements(<SubscribesToSelector />);
      expect(c.textContent).toEqual('loading');
      expect(evalCount).toBe(1);
      act(() => resolve(123));
      // We need to let the selector promise resolve but NOT flush timeouts because
      // we do release after suspending after a timeout and we don't want that
      // to happen because we're testing what happens when it doesn't.
      await flushPromises();
      await flushPromises();
      expect(c.textContent).toEqual('123');
      expect(evalCount).toBe(1); // Still in cache, hence wasn't released.
    },
  );

  testRecoil(
    'An async selector ignores promises that settle after it is released',
    async () => {
      let resolve;
      let evalCount = 0;
      const anAtom = atomRetainedBy('components');
      const aSelector = selector({
        key: 'retention/asyncSettlesAfterRelease',
        retainedBy_UNSTABLE: 'components',
        get: ({get}) => {
          evalCount++;
          get(anAtom);
          return new Promise(r => {
            resolve = r;
          });
        },
      });
      function SubscribesToSelector() {
        // Test without using Suspense to avoid complications with Jest promises
        // and timeouts when using Suspense. This doesn't affect what's under test.
        const l = useRecoilValueLoadable(aSelector);
        return l.state === 'loading' ? 'loading' : l.getValue();
      }
      const [Switch, setMounted] = switchComponent(true);

      const c = renderElements(
        <Switch>
          <SubscribesToSelector />
        </Switch>,
      );
      expect(c.textContent).toEqual('loading');
      expect(evalCount).toBe(1);
      act(() => setMounted(false)); // release selector while promise is in flight
      act(() => resolve(123));
      await flushPromises();
      act(() => setMounted(true));
      expect(evalCount).toBe(2); // selector must be re-evaluated because the resolved value is not in cache
      expect(c.textContent).toEqual('loading');
      act(() => resolve(123));
      await flushPromises();
      expect(c.textContent).toEqual('123');
    },
  );

  testRecoil(
    'Selector changing deps releases old deps, retains new ones',
    () => {
      const switchAtom = atom({
        key: 'switch',
        default: false,
      });
      const depA = atomRetainedBy('components');
      const depB = atomRetainedBy('components');
      const theSelector = selector({
        key: 'sel',
        get: ({get}) => {
          if (get(switchAtom)) {
            return get(depB);
          } else {
            return get(depA);
          }
        },
        retainedBy_UNSTABLE: 'components',
      });

      let setup;
      function Setup() {
        setup = useRecoilCallback(({set}) => () => {
          set(depA, 123);
          set(depB, 456);
        });
        return null;
      }

      function ReadsSelector() {
        useRecoilValue(theSelector);
        return null;
      }

      let depAValue;
      function ReadsDepA() {
        depAValue = useRecoilValue(depA);
        return null;
      }

      let depBValue;
      function ReadsDepB() {
        depBValue = useRecoilValue(depB);
        return null;
      }

      const [MountSwitch, setAtomsMountedDirectly] = switchComponent(true);

      function unmountAndRemount() {
        act(() => setAtomsMountedDirectly(false));
        act(() => setAtomsMountedDirectly(true));
      }

      const [ReadsSwitch, setDepSwitch] = componentThatReadsAndWritesAtom(
        switchAtom,
      );

      renderElements(
        <>
          <ReadsSelector />
          <ReadsSwitch />
          <MountSwitch>
            <ReadsDepA />
            <ReadsDepB />
          </MountSwitch>
          <Setup />
        </>,
      );

      act(() => {
        setup();
      });
      unmountAndRemount();
      expect(depAValue).toBe(123);
      expect(depBValue).toBe(0);
      act(() => {
        setDepSwitch(true);
      });
      unmountAndRemount();
      expect(depAValue).toBe(0);
      act(() => {
        setup();
      });
      unmountAndRemount();
      expect(depBValue).toBe(456);
    },
  );
});

describe('Retention during a transaction', () => {
  testRecoil(
    'Atoms are not released if unmounted and mounted within the same transaction',
    () => {
      const anAtom = atomRetainedBy('components');
      const [ReaderA, setAtom] = componentThatReadsAndWritesAtom(anAtom);
      const [ReaderB] = componentThatReadsAndWritesAtom(anAtom);
      const [SwitchA, setSwitchA] = switchComponent(true);
      const [SwitchB, setSwitchB] = switchComponent(false);

      const container = renderElements(
        <>
          <SwitchA>
            <ReaderA />
          </SwitchA>
          <SwitchB>
            <ReaderB />
          </SwitchB>
        </>,
      );

      act(() => setAtom(123));
      act(() => {
        setSwitchA(false);
        setSwitchB(true);
      });
      expect(container.textContent).toEqual('123');
    },
  );

  testRecoil(
    'An atom is released when two zones retaining it are released at the same time',
    () => {
      const zoneA = retentionZone();
      const zoneB = retentionZone();
      const anAtom = atomRetainedBy([zoneA, zoneB]);
      function RetainsZone({zone}) {
        useRetain(zone);
        return null;
      }
      // It's the no-longer-retained-when-unmounting-otherChildren part that is
      // important for this test.
      testWhetherAtomIsRetained(
        true,
        anAtom,
        <>
          <RetainsZone zone={zoneA} />
          <RetainsZone zone={zoneB} />
        </>,
      );
    },
  );

  testRecoil(
    'An atom is released when both direct-retainer and zone-retainer are released at the same time',
    () => {
      const zone = retentionZone();
      const anAtom = atomRetainedBy(zone);
      function RetainsZone() {
        useRetain(zone);
        return null;
      }
      function RetainsAtom() {
        useRetain(anAtom);
        return null;
      }
      // It's the no-longer-retained-when-unmounting-otherChildren part that is
      // important for this test.
      testWhetherAtomIsRetained(
        true,
        anAtom,
        <>
          <RetainsZone />
          <RetainsAtom />
        </>,
      );
    },
  );
});
