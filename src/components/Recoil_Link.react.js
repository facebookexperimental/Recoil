/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Creates an anchor element that navigates the application to a new state. The
 * link may be copied, bookmarked, or opened in a new tab. If the link is simply
 * clicked, then a fast code path will update the app without loading a
 * new document. In either case, atoms that have `backButton` set to true can be
 * restored by using the browser Back button.
 *
 * If an `onClick` handler is provided, it is called before the state transition
 * and may call preventDefault on the event to stop the state transition.
 *
 * Instead of an `href` prop, you supply two props:
 *
 *    hrefForAtomValues. This function takes a map of the values of all
 * URL-persisted atoms and should return a URL which will be used for the href.
 * It is recommended that your application wrap this component to provide a
 *         standardized hrefForAtomValues to be used for all links in the app;
 *         you might consider using a flexible serialization library such as
 * Transit.
 *
 *    stateChange. This function specifies the state change to take place when
 * the link is followed. It takes a function `update` that is used to update the
 * value of atoms instead of using a hook. Example:
 *
 *         stateChange={update => update(myAtom, x => x + 1)}
 *
 * Note that, because the link must encode the entire app state, this component
 * is re-rendered whenever any URL-persisted atom changes; keep the performance
 * implications of this in mind.
 *
 * @emails oncall+perf_viz
 * @flow strict-local
 * @format
 */
'use strict';

import type {RecoilState} from '../core/Recoil_RecoilValue';

const React = require('React');
const {useGoToSnapshot, useSnapshotWithStateChange} =
    require('../hooks/Recoil_Hooks');

type Props = {
  hrefForAtomValues: (Map<string, mixed>) => string,
  stateChange: (<T>(RecoilState<T>, (T) => T) => void) => void,

  rel?: string,
  target?: '_blank'|'_self'|'_parent'|'_top',
  onClick?: (SyntheticUIEvent<HTMLAnchorElement>) => void,
         children: ? React.Node, };

function Link({hrefForAtomValues, stateChange, onClick, target, ...rest}:
                  Props): React.Element<'a'> {
  const goToSnapshot = useGoToSnapshot();
  const snapshot = useSnapshotWithStateChange(update => stateChange(update));

  function myOnClick(event) {
    if (onClick) {
      onClick(event);
    }
    if (!event.defaultPrevented && event.button === 0 &&
        !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) &&
        (!target || target === '_self')) {
      event.preventDefault();
      goToSnapshot(snapshot);
    }
  }

  return (
    <a
      {...rest}
      target={target}
      onClick={myOnClick}
      href={
    hrefForAtomValues(snapshot.atomValues)}
    />
  );
}

module.exports = Link;
