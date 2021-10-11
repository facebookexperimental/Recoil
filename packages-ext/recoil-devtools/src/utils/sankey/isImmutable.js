/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow
 * @format
 */

'use strict';

import immutable from 'immutable';

// The version of immutable in www is out of date and doesn't implement
// isImmutable; this can be removed when it is upgraded to v4. For forwards-
// compatibility, use the implementation from the library if it exists:
const isImmutable: Object => boolean =
  (immutable: any).isImmutable ||
  function isImmutable(o: Object): boolean {
    return !!(
      o['@@__IMMUTABLE_ITERABLE__@@'] ||
      o['@@__IMMUTABLE_KEYED__@@'] ||
      o['@@__IMMUTABLE_INDEXED__@@'] ||
      o['@@__IMMUTABLE_ORDERED__@@'] ||
      o['@@__IMMUTABLE_RECORD__@@']
    );
  };

export default isImmutable;
