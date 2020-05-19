'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./RecoilUtils.production.js');
} else {
  module.exports = require('./RecoilUtils.development.js');
}
