const React = require('React');

// FIXME T2710559282599660
const useMutableSource =
  (React: any).useMutableSource ?? (React: any).unstable_useMutableSource; // flowlint-line unclear-type:off

function mutableSourceIsExist() {
  return (
    useMutableSource &&
    !(
      typeof window !== 'undefined' &&
      window.$disableRecoilValueMutableSource_TEMP_HACK_DO_NOT_USE
    )
  );
}

module.exports = {
  mutableSourceIsExist,
  useMutableSource,
};
