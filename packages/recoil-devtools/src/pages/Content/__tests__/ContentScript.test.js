// Mock spies
const handlers = [];
const bg = {
  onDisconnect: {
    addListener: jest.fn(),
  },
  onMessage: {
    addListener: jest.fn(),
  },
  postMessage: jest.fn(msg => {
    if (msg.message?.mustThrow) {
      throw new Error('Message length exceeded maximum allowed length.');
    }
  }),
};

// Mock global objects
global.chrome = {
  extension: {
    getURL: () => '',
  },
  runtime: {
    connect: () => bg,
  },
};

global.window.addEventListener = (evt, handler) => {
  handlers.push(handler);
};

global.__DEV__ = true;

const {
  ExtensionSource,
  ExtensionSourceContentScript,
  RecoilDevToolsActions,
  MessageChunkSize,
} = require('../../../constants/Constants');

// Mock constants
jest.mock('../../../constants/Constants', () => ({
  ExtensionSource: 'source',
  ExtensionSourceContentScript: 'script',
  RecoilDevToolsActions: {
    INIT: 'recoil_devtools_init',
    UPDATE: 'recoil_devtools_update',
    UPLOAD_CHUNK: 'recoil_devtools_chunk',
  },
  MessageChunkSize: 50,
}));

const {initContentScriptListeners} = require('../ContentScript');

describe('initializing Content Script listeners', () => {
  it('sets events handler', () => {
    expect(handlers.length).toEqual(1);
  });

  const EvtHandler = handlers[0];

  it('ignore message with wrong source', () => {
    EvtHandler({
      data: {
        action: RecoilDevToolsActions.INIT,
        source: 'other',
      },
    });
    expect(bg.postMessage).not.toHaveBeenCalled();
  });

  it('ignore message with missing action', () => {
    EvtHandler({
      data: {
        source: ExtensionSource,
      },
    });
    expect(bg.postMessage).not.toHaveBeenCalled();
  });

  it('inits connection', () => {
    EvtHandler({
      data: {
        action: RecoilDevToolsActions.INIT,
        source: ExtensionSource,
      },
    });
    expect(bg.postMessage).toHaveBeenCalledWith({
      action: RecoilDevToolsActions.INIT,
      data: {},
    });
  });

  it('Sends updates', () => {
    EvtHandler({
      data: {
        action: RecoilDevToolsActions.UPDATE,
        source: ExtensionSource,
        message: {modifiedValues: {a: {t: '0', v: 2}}},
      },
    });
    expect(bg.postMessage).toHaveBeenLastCalledWith({
      action: RecoilDevToolsActions.UPDATE,
      source: ExtensionSource,
      message: {
        modifiedValues: {
          a: {t: '0', v: 2},
        },
      },
    });
  });

  it('Sends updates in chunks after size error', () => {
    bg.postMessage.mockClear();

    EvtHandler({
      data: {
        action: RecoilDevToolsActions.UPDATE,
        source: ExtensionSource,
        message: {mustThrow: true, modifiedValues: {a: {t: '0', v: 2}}},
      },
    });
    expect(bg.postMessage).toHaveBeenCalledTimes(4);

    expect(bg.postMessage).toHaveBeenNthCalledWith(2, {
      action: RecoilDevToolsActions.UPLOAD_CHUNK,
      chunk: '{"action":"recoil_devtools_update","source":"sourc',
      isFinalChunk: false,
      txID: -1,
    });

    expect(bg.postMessage).toHaveBeenNthCalledWith(3, {
      action: RecoilDevToolsActions.UPLOAD_CHUNK,
      chunk: 'e","message":{"mustThrow":true,"modifiedValues":{"',
      isFinalChunk: false,
      txID: -1,
    });

    expect(bg.postMessage).toHaveBeenNthCalledWith(4, {
      action: RecoilDevToolsActions.UPLOAD_CHUNK,
      chunk: 'a":{"t":"0","v":2}}}}',
      isFinalChunk: true,
      txID: -1,
    });
  });
});
