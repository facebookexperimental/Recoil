/**
 * Copyright 2004-present Facebook. All Rights Reserved.
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
