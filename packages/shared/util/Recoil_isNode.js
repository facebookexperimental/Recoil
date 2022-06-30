/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

function isNode(object: mixed): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const doc =
    object != null ? (object: $FlowFixMe).ownerDocument ?? object : document;
  const defaultView = doc.defaultView ?? window;
  return !!(
    object != null &&
    (typeof defaultView.Node === 'function'
      ? object instanceof defaultView.Node
      : typeof object === 'object' &&
        typeof object.nodeType === 'number' &&
        typeof object.nodeName === 'string')
  );
}

module.exports = isNode;
