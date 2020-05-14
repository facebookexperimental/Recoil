/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */

'use strict';

function isNode(object: mixed): boolean {
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
