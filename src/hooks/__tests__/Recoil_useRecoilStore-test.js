const React = require('React');
const ReactDOM = require('ReactDOM');
const {useEffect} = require('React');
const {act} = require('ReactTestUtils');

const {SimpleRenderer} = require('../../testing/Recoil_SimpleReconciler');
const {ReadsAtom} = require('../../testing/Recoil_TestingUtils');

const {useRecoilValue} = require('../Recoil_Hooks');
const {RecoilRoot} = require('../../../src/core/Recoil_RecoilRoot.react');
const atom = require('../../recoil_values/Recoil_atom');
const {useRecoilStore_UNSTABLE} = require('../../Recoil_index');

const SimpleRendererBridge = ({children}) => {
  const store = useRecoilStore_UNSTABLE();

  return (
    <SimpleRenderer>
      <RecoilRoot store={store}>{children}</RecoilRoot>
    </SimpleRenderer>
  );
};

test('useRecoilStore - create a context bridge', () => {
  const container = document.createElement('div');

  const myAtom = atom({
    key: 'useRecoilStore - create bridge',
    default: 'DEFAULT',
  });

  function initializeState({set, getLoadable}) {
    expect(getLoadable(myAtom).contents).toEqual('DEFAULT');
    set(myAtom, 'INITIALIZE');
    expect(getLoadable(myAtom).contents).toEqual('INITIALIZE');
  }

  act(() => {
    ReactDOM.render(
      <RecoilRoot initializeState={initializeState}>
        <ReadsAtom atom={myAtom} />

        <SimpleRendererBridge>
          <ReadsAtom atom={myAtom} />
        </SimpleRendererBridge>
      </RecoilRoot>,
      container,
    );
  });

  expect(container.textContent).toEqual('"INITIALIZE""INITIALIZE"');
});
