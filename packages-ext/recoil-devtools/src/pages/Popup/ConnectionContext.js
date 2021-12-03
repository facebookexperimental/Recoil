/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type Connection from '../../utils/Connection';

const React = require('react');

const ConnectionContext = React.createContext<?Connection>(null);

module.exports = ConnectionContext;
