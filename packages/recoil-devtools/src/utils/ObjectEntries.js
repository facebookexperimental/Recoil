/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict
 * @format
 */

// flowlint ambiguous-object-type:error

/**
 * The return type of Object.entries() in Flow is Array<Array<string, mixed>>,
 * even if the object's type is stricter.
 *
 * This helper provides a way to carry Flow typing through to the result.
 *
 * BEWARE: `Object.entries` coerces to numeric keys to strings,
 * so this function does too. E.g., `objectEntries({1: 'lol'})` is
 * equivalent to `[['1', 'lol']]` and NOT `[[1, 'lol']]`. Thus, Flow will
 * incorrectly type the return in these cases.
 */
export default function objectEntries<TKey, TValue>(obj: {
  +[TKey]: TValue,
  ...
}): Array<[TKey, TValue]> {
  if (__DEV__) {
    if (obj instanceof Map) {
      // eslint-disable-next-line fb-www/no-console
      console.error(
        "objectEntries doesn't work on Map instances; use instance.entries() instead",
      );
    }
  }
  // $FlowFixMe[unclear-type]
  return (Object.entries(obj): any);
}
