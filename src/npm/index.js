'use strict';

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./recoil.production.js');
} else {
    module.exports = require('./recoil.development.js');
}
