'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./recoil.production');
} else {
  module.exports = require('./recoil.development');
}
