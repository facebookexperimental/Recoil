/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {MutableSnapshot, Snapshot} from '../../core/Recoil_Snapshot';

const React = require('React');
const {useCallback} = require('React');

const {
  useGotoRecoilSnapshot,
  useRecoilSnapshot,
} = require('../../hooks/Recoil_Hooks');

type AnchorProps = {
  download?: true | string,
  rel?: string,
  target?: '_self' | '_blank' | '_parent' | '_top',
  onClick?: (SyntheticUIEvent<HTMLAnchorElement>) => void,
  style?: {[string]: string | number, ...},
  children?: React.Node,
};

type SerializationProps = {
  uriFromSnapshot: Snapshot => string,
};

type LinkToSnapshotProps = {
  ...AnchorProps,
  ...SerializationProps,
  snapshot: Snapshot,
};

// A Link component based on the provided `uriFromSnapshot` mapping
// of a URI from a Recoil Snapshot.
//
// The Link element renders an anchor element.  But instead of an href, use a
// `snapshot` property.  When clicked, the Link element updates the current
// state to the snapshot without loading a new document.
//
// The href property of the anchor will set using `uriFromSnapshot`.  This
// allows users to copy the link, choose to open in a new tab, &c.
//
// If an `onClick` handler is provided, it is called before the state transition
// and may call preventDefault on the event to stop the state transition.
function LinkToRecoilSnapshot({
  uriFromSnapshot,
  snapshot,
  ...anchorProps
}: LinkToSnapshotProps): React.Node {
  const gotoSnapshot = useGotoRecoilSnapshot();

  const onClick = useCallback(
    event => {
      anchorProps.onClick?.(event);
      if (
        !event.defaultPrevented &&
        event.button === 0 && // left-click
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) &&
        (!anchorProps.target || anchorProps.target === '_self')
      ) {
        event.preventDefault();
        gotoSnapshot(snapshot);
      }
    },
    [gotoSnapshot, anchorProps.onClick, anchorProps.target, snapshot],
  );

  return (
    <a {...anchorProps} href={uriFromSnapshot(snapshot)} onClick={onClick} />
  );
}

type LinkToStateChangeProps = {
  ...AnchorProps,
  ...SerializationProps,
  stateChange: MutableSnapshot => void,
};

// A Link component based on the provided `uriFromSnapshot` mapping
// of a URI from a Recoil Snapshot.
//
// The Link element renders an anchor element.  But instead of an href, use a
// `stateChange` property.  When clicked, the Link element updates the current
// state based on the `stateChange` callback without loading a new document.
// `stateChange` is a function which takes a `MutableSnapshot` that can be used
// to read the current state and set or update any changes.
//
// The href property of the anchor will set using `uriFromSnapshot`.  This
// allows users to copy the link, choose to open in a new tab, &c.
//
// If an `onClick` handler is provided, it is called before the state transition
// and may call preventDefault on the event to stop the state transition.
//
// Note that, because the link renders the href based on the current state
// snapshot, it is re-rendered whenever any state change is made.  Keep the
// performance implications of this in mind.
function LinkToRecoilStateChange({
  stateChange,
  ...linkProps
}: LinkToStateChangeProps): React.Node {
  const currentSnapshot = useRecoilSnapshot();
  const snapshot = currentSnapshot.map(stateChange);
  return <LinkToRecoilSnapshot {...linkProps} snapshot={snapshot} />;
}

module.exports = {
  LinkToRecoilSnapshot,
  LinkToRecoilStateChange,
};
