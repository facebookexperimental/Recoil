// Minimum TypeScript Version: 3.7

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 */

import {
  Get,
  boolean,
  stringLiterals,
  string,
  number,
  mixed,
  nullable,
  voidable,
  date,
  custom,
  asType,
  match,
  union,
  or,
  object,
  dict,
  array,
  tuple,
  map,
  set,
  writableObject,
  writableArray,
  writableDict,
  optional,
} from 'refine';

// turn of lint for unused test vars
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 *
 * utility type tests
 *
 */
{
  const checker = object({a: number()});
  type MyType = Get<typeof checker>;
  const x: MyType = {
    a: 1,
  };

  const y: MyType = {
    a: 'test', // $ExpectError
  };
}

/**
 *
 * primitive tests
 *
 */
{
  const rboolean = boolean()({});
  if (rboolean.type === 'success') {
    const v: boolean = rboolean.value;
  }

  const rstring = string()({});
  if (rstring.type === 'success') {
    const v: string = rstring.value;
  }

  const rnumber = number()({});
  if (rnumber.type === 'success') {
    const v: number = rnumber.value;
  }

  const runknown = mixed()({});
  if (runknown.type === 'success') {
    const v: unknown = runknown.value;
  }

  const rliterals = stringLiterals<'a' | 'b'>({a: 'a', b: 'b'})({});
  if (rliterals.type === 'success') {
    const v: 'a' | 'b' = rliterals.value;
  }

  const rsorn = or(string(), number())({});
  if (rsorn.type === 'success') {
    const v: string | number = rsorn.value;
  }

  const rsunionn = union(string(), number(), boolean())({});
  if (rsunionn.type === 'success') {
    const v: string | number | boolean = rsunionn.value;
  }

  const rvoidablestring = voidable(string())({});
  if (rvoidablestring.type === 'success') {
    const v: undefined | string = rvoidablestring.value;
    const x: string = rvoidablestring.value; // $ExpectError
    const z: string | null = rvoidablestring.value; // $ExpectError
  }

  const rnullable = nullable(string())({});
  if (rnullable.type === 'success') {
    const v: null | string | undefined = rnullable.value;
    const x: string = rnullable.value; // $ExpectError
    const z: string | undefined = rnullable.value; // $ExpectError
  }

  const rdate = date()({});
  if (rdate.type === 'success') {
    const v: Date = rdate.value;
  }
}

/**
 *
 * collection tests
 *
 */
{
  const rarray = array(string())({});
  if (rarray.type === 'success') {
    const s: string = rarray.value[0];
    rarray.value.push('test'); // $ExpectError
  }

  const rwarray = writableArray(string())({});
  if (rwarray.type === 'success') {
    const s: string = rwarray.value[0];
    rwarray.value.push('test');
  }
}

{
  const check = object({a: optional(string()), b: string()});

  type ObjectWithOptional = Get<typeof check>;

  const r1: ObjectWithOptional = {
    b: 'test',
  };

  const r2: ObjectWithOptional = {
    b: 'test',
    a: 'test',
  };

  const result = check({});

  if (result.type === 'success') {
    result.value.b.includes('test');
  } else {
    result.message.includes('');
  }

  const rwobject = writableObject({c: number()})({});
  if (rwobject.type === 'success') {
    rwobject.value.c = 1;
    const v: {c: number} = rwobject.value;
  }
}

{
  const rdict = dict(string())({});
  if (rdict.type === 'success') {
    const v: {readonly [key: string]: string} = rdict.value;
  }

  const rwdict = writableDict(number())({});
  if (rwdict.type === 'success') {
    rwdict.value.key = 1;
    const v: {[key: string]: number} = rwdict.value;
  }
}

{
  const rtuple = tuple(string(), number())({});
  if (rtuple.type === 'success') {
    const v: readonly [string, number] = rtuple.value;
  }
}

{
  const rmap = map(array(string()), dict(number()))({});
  if (rmap.type === 'success') {
    const v: ReadonlyMap<readonly string[], Readonly<{[key: string]: number}>> = rmap.value;
  }
}

{
  const rset = set(date())({});
  if (rset.type === 'success') {
    const v: ReadonlySet<Date> = rset.value;
  }
}

/**
 *
 * utilities
 *
 */
{
  const rasnum = asType(string(), s => parseInt(s, 10))({});
  if (rasnum.type === 'success') {
    const v: number = rasnum.value;
  }

  const rmatch = match(
    asType(number(), n => n.toString()),
    asType(boolean(), b => b.toString()),
    string()
  )({});

  if (rmatch.type === 'success') {
    const v: string = rmatch.value;
  }

  class Custom {}

  const isCustomClass = custom(value => value instanceof Custom ? value : null);
  const rcustomclass = isCustomClass({});

  if (rcustomclass.type === 'success') {
    const v: Custom = rcustomclass.value;
  }
}
