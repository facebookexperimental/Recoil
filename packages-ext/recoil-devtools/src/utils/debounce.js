/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Recoil DevTools browser extension.
 *
 * @flow strict-local
 * @format
 * @oncall recoil
 */

// $FlowFixMe[unclear-type] We want the flexibility of any here
type DebouncedFunc = (...args: Array<any>) => void;

export default function debounce(
  func: DebouncedFunc,
  wait: number,
  immediate?: boolean,
): DebouncedFunc {
  let timeout;

  return function (...args: Array<mixed>): void {
    const context = this;
    const later = function () {
      timeout = null;
      if (!Boolean(immediate)) func.apply(context, args);
    };
    const callNow = Boolean(immediate) && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}
