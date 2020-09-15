const React = require('React');

function mutableSourceIsExist() {
  return (
    (React.useMutableSource ?? React.unstable_useMutableSource) &&
    !window.disableRecoilValueMutableSource
  );
}

module.exports = {
  mutableSourceIsExist,
};
