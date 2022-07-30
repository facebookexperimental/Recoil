/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */
'use strict';

import type Connection from '../../utils/Connection';

const React = require('react');

const ConnectionContext: React$Context<?Connection> =
  React.createContext<?Connection>(null);

module.exports = ConnectionContext;
