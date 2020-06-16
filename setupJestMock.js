const Promise = require('promise-polyfill');

jest.mock('gkx');

global.Promise = Promise;
