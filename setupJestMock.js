const Promise = require('promise-polyfill');

jest.mock('gkx');

global.Promise = Promise;

// mock console error and console warn for CI to avoid tests fail
if (process.env.CI) {
  jest.spyOn(global.console, 'error').mockImplementation((...args) => {
    console.log('error', ...args);
  });
  jest.spyOn(global.console, 'warn').mockImplementation((...args) => {
    console.log('warn', ...args);
  });
}
