/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @format
 * @oncall recoil
 */
'use strict';

const config = require('../webpack.config');
const webpack = require('webpack');

delete config.chromeExtensionBoilerplate;

webpack(config, function (err) {
  if (err) throw err;
});
