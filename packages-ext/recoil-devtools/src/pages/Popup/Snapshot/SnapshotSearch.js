/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

import React, {useCallback, useContext, useRef} from 'react';
import debounce from '../../../utils/debounce';
import SearchContext from './SearchContext';

export default function SnapshotSearch(): React$MixedElement {
  const {searchVal, setSearchVal} = useContext(SearchContext);
  const inputRef = useRef(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleKeyDown = useCallback(
    debounce((e: SyntheticKeyboardEvent<HTMLInputElement>) => {
      setSearchVal(inputRef.current?.value ?? '');
    }, 300),
    [setSearchVal],
  );

  return (
    <div>
      Search: <input ref={inputRef} onKeyDown={handleKeyDown} />
      <br />
      Currently filtering for: {searchVal}
    </div>
  );
}
