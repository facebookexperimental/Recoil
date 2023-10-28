const {useMemo, useRef, useEffect, useState} = require('react');

const selector = require('../recoil_values/Recoil_selector');

let uniqueId = 1;

function useRecoilSelector(selectionFn) {
  const selectionFnRef = useRef(selectionFn);
  selectionFnRef.current = selectionFn;

  const result = useMemo(
    () =>
      selector({
        key: `useRecoilSelector_${uniqueId++}`,
        get: (...args) => selectionFnRef.current(...args),
      }),
    [],
  );

  useEffect(() => {
    return () => {
      uniqueId -= 1;
    };
  }, []);

  return result;
}

module.exports = useRecoilSelector;
