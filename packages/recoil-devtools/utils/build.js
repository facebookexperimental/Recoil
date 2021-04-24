/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @format
 */
'use strict';

const config = require('../webpack.config');
const webpack = require('webpack');

delete config.chromeExtensionBoilerplate;

webpack(config, function (err) {
  if (err) throw err;
});
