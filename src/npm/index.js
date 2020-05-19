'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./recoil.browser.production.js');
} else {
  module.exports = require('./recoil.browser.development.js');
}
