'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./Recoil.production.js');
} else {
  module.exports = require('./Recoil.development.js');
}
