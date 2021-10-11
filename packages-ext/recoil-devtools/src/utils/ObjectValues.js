/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow strict
 * @format
 */

// flowlint ambiguous-object-type:error

'use strict';

/**
 * The return type of Object.values() in Flow is Array<mixed>. This is because
 * Flow doesn't require objects to be $Exact, so it cannot guarantee that
 * an object matching `{foo: string}` isn't actually `{foo: 'bar', baz: 123}` at
 * runtime.
 *
 * But... for code using object-as-map, e.g. `{[fooID: FBID]: Foo}`, this is
 * just too common. So wrap Flow and lie slightly about the types.
 */
export default function objectValues<TValue>(obj: {
  +[key: mixed]: TValue,
  ...
}): Array<TValue> {
  //$FlowFixMe[unclear-type]
  return (Object.values(obj): any);
}
