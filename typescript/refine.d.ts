// Minimum TypeScript Version: 3.9

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 */

type CheckerResult<V> = V extends Checker<infer Result>
  ? Result
  : V extends OptionalPropertyChecker<infer OptionalResult>
  ? OptionalResult
  : never;

export type CheckerReturnType<V> = V extends Checker<infer Result>
  ? Result
  : never;

/**
 * This file is a manual translation of the flow types, which are the source of truth, so we should not introduce new terminology or behavior in this file.
 */

export class Path {
  constructor(parent?: Path | null, field?: string);
  extend(field: string): Path;
  toString(): string;
}

/**
 * the result of failing to match a value to its expected type
 */
export type CheckFailure = Readonly<{
  type: 'failure';
  message: string;
  path: Path;
}>;

/**
 * the result of successfully matching a value to its expected type
 */
export type CheckSuccess<V> = Readonly<{
  type: 'success';
  value: V;
  // if using `nullable` with the `nullWithWarningWhenInvalid` option,
  // failures will be appended here
  warnings: ReadonlyArray<CheckFailure>;
}>;

/**
 * the result of checking whether a type matches an expected value
 */
export type CheckResult<V> = CheckSuccess<V> | CheckFailure;

/**
 * a function which checks if a given mixed value matches a type V,
 * returning the value if it does, otherwise a failure message.
 */
export type Checker<V> = (value: unknown, path?: Path) => CheckResult<V>;

/**
 * wrap value in an object signifying successful checking
 */
export function success<V>(
  value: V,
  warnings: ReadonlyArray<CheckFailure>,
): CheckSuccess<V>;

/**
 * indicate typecheck failed
 */
export function failure(message: string, path: Path): CheckFailure;

/**
 * utility function for composing checkers
 */
export function compose<T, V>(
  checker: Checker<T>,
  next: (success: CheckSuccess<T>, path: Path) => CheckResult<V>,
): Checker<V>;

/**
 * function to assert that a given value matches a checker
 */
export type AssertionFunction<V> = (value: unknown) => V;

/**
 * function to coerce a given value to a checker type, returning null if invalid
 */
export type CoercionFunction<V> = (value: unknown) => V | null | undefined;

/**
 * create a function to assert a value matches a checker, throwing otherwise
 *
 * For example,
 *
 * ```
 * const assert = assertion(array(number()));
 * const value: Array<number> = assert([1,2]);
 *
 * try {
 *   // should throw with `Refine.js assertion failed: ...`
 *   const invalid = assert('test');
 * } catch {
 * }
 * ```
 */
export function assertion<T>(
  checker: Checker<T>,
  errorMessage?: string,
): AssertionFunction<T>;

/**
 * create a CoercionFunction given a checker.
 *
 * Allows for null-coercing a value to a given type using a checker. Optionally
 * provide a callback which receives the full check
 * result object (e.g. for logging).
 *
 * Example:
 *
 * ```javascript
 * import {coercion, record, string} from 'refine';
 * import MyLogger from './MyLogger';
 *
 * const Person = record({
 *   name: string(),
 *   hobby: string(),
 * });
 *
 * const coerce = coercion(Person, result => MyLogger.log(result));
 *
 * declare value: mixed;
 *
 * // ?Person
 * const person = coerce(value);
 * ```
 */
export function coercion<T>(
  checker: Checker<T>,
  onResult?: (checker: CheckResult<T>) => void,
): CoercionFunction<T>;

/**
 * checker to assert if a mixed value is an array of
 * values determined by a provided checker
 */
export function array<V>(valueChecker: Checker<V>): Checker<ReadonlyArray<V>>;

/**
 * checker to assert if a mixed value is a tuple of values
 * determined by provided checkers. Extra entries are ignored.
 *
 * Example:
 * ```jsx
 * const checker = tuple( number(), string() );
 * ```
 *
 * Example with optional trailing entry:
 * ```jsx
 * const checker = tuple( number(), voidable(string()));
 * ```
 */
export function tuple<Checkers extends [...unknown[]]>(
  ...checkers: Checkers
): Checker<Readonly<{[K in keyof Checkers]: CheckerResult<Checkers[K]>}>>;

/**
 * checker to assert if a mixed value is a string-keyed dict of
 * values determined by a provided checker
 */
export function dict<V>(
  valueChecker: Checker<V>,
): Checker<Readonly<{[key: string]: V}>>;

// expose opaque version of optional property as public api,
// forcing consistent usage of built-in `optional` to define optional properties
declare const __opaque: unique symbol;
export interface OptionalPropertyChecker<T> {
  readonly [__opaque]: T;
}

/**
 * checker which can only be used with `object` or `writablObject`. Marks a
 * field as optional, skipping the key in the result if it doesn't
 * exist in the input.
 *
 * @example
 * ```jsx
 * import {object, string, optional} from 'refine';
 *
 * const checker = object({a: string(), b: optional(string())});
 * assert(checker({a: 1}).type === 'success');
 * ```
 */
export function optional<T>(checker: Checker<T>): OptionalPropertyChecker<T>;

type CheckerObject = Readonly<{
  [key: string]: Checker<unknown> | OptionalPropertyChecker<unknown>;
}>;

type CheckersToValues<Checkers extends CheckerObject> = {
  [K in keyof Checkers]: CheckerResult<Checkers[K]>;
};

type WhereValue<Checkers extends CheckerObject, Condition> = Pick<
  Checkers,
  {
    [Key in keyof Checkers]: Checkers[Key] extends Condition ? Key : never;
  }[keyof Checkers]
>;

type RequiredCheckerProperties<Checkers extends CheckerObject> = WhereValue<
  Checkers,
  Checker<unknown>
>;

type OptionalCheckerProperties<Checkers extends CheckerObject> = Partial<
  WhereValue<Checkers, OptionalPropertyChecker<unknown>>
>;

type ObjectCheckerResult<Checkers extends CheckerObject> = CheckersToValues<
  RequiredCheckerProperties<Checkers> & OptionalCheckerProperties<Checkers>
>;

/**
 * checker to assert if a mixed value is a fixed-property object,
 * with key-value pairs determined by a provided object of checkers.
 * Any extra properties in the input object values are ignored.
 * Class instances are not supported, use the custom() checker for those.
 *
 * Example:
 * ```jsx
 * const myObject = object({
 *   name: string(),
 *   job: object({
 *     years: number(),
 *     title: string(),
 *   }),
 * });
 * ```
 *
 * Properties can be optional using `voidable()` or have default values
 * using `withDefault()`:
 * ```jsx
 * const customer = object({
 *   name: string(),
 *   reference: voidable(string()),
 *   method: withDefault(string(), 'email'),
 * });
 * ```
 */
export function object<Checkers extends CheckerObject>(
  checkers: Checkers,
): Checker<Readonly<ObjectCheckerResult<Checkers>>>;

/**
 * checker to assert if a mixed value is a Set type
 */
export function set<T>(checker: Checker<T>): Checker<ReadonlySet<T>>;

/**
 * checker to assert if a mixed value is a Map.
 */
export function map<K, V>(
  keyChecker: Checker<K>,
  valueChecker: Checker<V>,
): Checker<ReadonlyMap<K, V>>;

/**
 * identical to `array()` except the resulting value is a writable flow type.
 */
export function writableArray<V>(valueChecker: Checker<V>): Checker<V[]>;

/**
 * identical to `dict()` except the resulting value is a writable flow type.
 */
export function writableDict<V>(
  valueChecker: Checker<V>,
): Checker<{[key: string]: V}>;

/**
 * identical to `object()` except the resulting value is a writable flow type.
 */
export function writableObject<Checkers extends CheckerObject>(
  checkers: Checkers,
): Checker<ObjectCheckerResult<Checkers>>;

/**
 * function which takes a json string, parses it,
 * and matches it with a checker (returning null if no match)
 */
export type JSONParser<T> = (input: string | null | undefined) => T;

/**
 * creates a JSON parser which will error if the resulting value is invalid
 */
export function jsonParserEnforced<T>(
  checker: Checker<T>,
  suffix?: string,
): JSONParser<T>;

/**
 * convienience function to wrap a checker in a function
 * for easy JSON string parsing.
 */
export function jsonParser<T>(
  checker: Checker<T>,
): JSONParser<T | undefined | null>;

/**
 * a mixed (i.e. untyped) value
 */
export function mixed(): Checker<unknown>;

/**
 * checker to assert if a mixed value matches a literal value
 */
export function literal<T extends string | boolean | number | null | undefined>(
  literalValue: T,
): Checker<T>;

/**
 * boolean value checker
 */
export function bool(): Checker<boolean>;

/**
 * checker to assert if a mixed value is a number
 */
export function number(): Checker<number>;

/**
 * Checker to assert if a mixed value is a string.
 *
 * Provide an optional RegExp template to match string against.
 */
export function string(regex?: RegExp): Checker<string>;

/**
 * checker to assert if a mixed value matches a union of string literals.
 * Legal values are provided as keys in an object and may be translated by
 * providing values in the object.
 *
 * For example:
 * ```jsx
 * ```
 */
export function stringLiterals<T>(enumValues: {
  readonly [key: string]: T;
}): Checker<T>;

/**
 * checker to assert if a mixed value is a Date object
 */
export function date(): Checker<Date>;

/**
 * Cast the type of a value after passing a given checker
 *
 * For example:
 *
 * ```javascript
 * import {string, asType} from 'refine';
 *
 * opaque type ID = string;
 *
 * const IDChecker: Checker<ID> = asType(string(), s => (s: ID));
 * ```
 */
export function asType<A, B>(
  checker: Checker<A>,
  cast: (input: A) => B,
): Checker<B>;

/**
 * checker which asserts the value matches
 * at least one of the two provided checkers
 */
export function or<A, B>(
  aChecker: Checker<A>,
  bChecker: Checker<B>,
): Checker<A | B>;

type ElementType<T> = T extends unknown[] ? T[number] : T;

/**
 * checker which asserts the value matches
 * at least one of the provided checkers
 */
export function union<Checkers extends ReadonlyArray<Checker<unknown>>>(
  ...checkers: Checkers
): Checker<ElementType<{[K in keyof Checkers]: CheckerResult<Checkers[K]>}>>;

/**
 * Provide a set of checkers to check in sequence to use the first match.
 * This is similar to union(), but all checkers must have the same type.
 *
 * This can be helpful for supporting backward compatibility.  For example the
 * following loads a string type, but can also convert from a number as the
 * previous version or pull from an object as an even older version:
 *
 * ```jsx
 * const backwardCompatibilityChecker: Checker<string> = match(
 *   string(),
 *   asType(number(), num => `${num}`),
 *   asType(record({num: number()}), obj => `${obj.num}`),
 * );
 * ```
 */
export function match<T>(...checkers: ReadonlyArray<Checker<T>>): Checker<T>;

/**
 * wraps a given checker, making the valid value nullable
 *
 * By default, a value passed to nullable must match the checker spec exactly
 * when it is not null, or it will fail.
 *
 * passing the `nullWithWarningWhenInvalid` enables gracefully handling invalid
 * values that are less important -- if the provided checker is invalid,
 * the new checker will return null.
 *
 * For example:
 *
 * ```javascript
 * import {nullable, record, string} from 'refine';
 *
 * const Options = record({
 *   // this must be a non-null string,
 *   // or Options is not valid
 *   filename: string(),
 *
 *   // if this field is not a string,
 *   // it will be null and Options will pass the checker
 *   description: nullable(string(), {
 *     nullWithWarningWhenInvalid: true,
 *   })
 * })
 *
 * const result = Options({filename: 'test', description: 1});
 *
 * invariant(result.type === 'success');
 * invariant(result.value.description === null);
 * invariant(result.warnings.length === 1); // there will be a warning
 * ```
 */
export function nullable<T>(
  checker: Checker<T>,
  options?: Readonly<{
    // if this is true, the checker will not fail
    // validation if an invalid value is provided, instead
    // returning null and including a warning as to the invalid type.
    nullWithWarningWhenInvalid?: boolean;
  }>,
): Checker<T | null | undefined>;

/**
 * wraps a given checker, making the valid value voidable
 *
 * By default, a value passed to voidable must match the checker spec exactly
 * when it is not undefined, or it will fail.
 *
 * passing the `undefinedWithWarningWhenInvalid` enables gracefully handling invalid
 * values that are less important -- if the provided checker is invalid,
 * the new checker will return undefined.
 *
 * For example:
 *
 * ```javascript
 * import {voidable, record, string} from 'refine';
 *
 * const Options = record({
 *   // this must be a string, or Options is not valid
 *   filename: string(),
 *
 *   // this must be a string or undefined,
 *   // or Options is not valid
 *   displayName: voidable(string()),
 *
 *   // if this field is not a string,
 *   // it will be undefined and Options will pass the checker
 *   description: voidable(string(), {
 *     undefinedWithWarningWhenInvalid: true,
 *   })
 * })
 *
 * const result = Options({filename: 'test', description: 1});
 *
 * invariant(result.type === 'success');
 * invariant(result.value.description === undefined);
 * invariant(result.warnings.length === 1); // there will be a warning
 * ```
 */
export function voidable<T>(
  checker: Checker<T>,
  options?: Readonly<{
    // if this is true, the checker will not fail
    // validation if an invalid value is provided, instead
    // returning undefined and including a warning as to the invalid type.
    undefinedWithWarningWhenInvalid?: boolean;
  }>,
): Checker<T | undefined>;

/**
 * a checker that provides a withDefault value if the provided value is nullable.
 *
 * For example:
 * ```jsx
 * const objPropertyWithDefault = record({
 *   foo: withDefault(number(), 123),
 * });
 * ```
 * Both `{}` and `{num: 123}` will refine to `{num: 123}`
 */
export function withDefault<T>(checker: Checker<T>, fallback: T): Checker<T>;

/**
 * wraps a checker with a logical constraint.
 *
 * Predicate function can return either a boolean result or
 * a tuple with a result and message
 *
 * For example:
 *
 * ```javascript
 * import {number, constraint} from 'refine';
 *
 * const evenNumber = constraint(
 *   number(),
 *   n => n % 2 === 0
 * );
 *
 * const passes = evenNumber(2);
 * // passes.type === 'success';
 *
 * const fails = evenNumber(1);
 * // fails.type === 'failure';
 * ```
 */
export function constraint<T>(
  checker: Checker<T>,
  predicate: (value: T) => boolean | [boolean, string],
): Checker<T>;

/**
 * wrapper to allow for passing a lazy checker value. This enables
 * recursive types by allowing for passing in the returned value of
 * another checker. For example:
 *
 * ```javascript
 * const user = record({
 *   id: number(),
 *   name: string(),
 *   friends: array(lazy(() => user))
 * });
 * ```
 *
 * Example of array with arbitrary nesting depth:
 * ```jsx
 * const entry = or(number(), array(lazy(() => entry)));
 * const nestedArray = array(entry);
 * ```
 */
export function lazy<T>(getChecker: () => Checker<T>): Checker<T>;

/**
 * helper to create a custom checker from a provided function.
 * If the function returns a non-nullable value, the checker succeeds.
 *
 * ```jsx
 * const myClassChecker = custom(x => x instanceof MyClass ? x : null);
 * ```
 *
 * Nullable custom types can be created by composing with `nullable()` or
 * `voidable()` checkers:
 *
 * ```jsx
 * const maybeMyClassChecker =
 *   nullable(custom(x => x instanceof MyClass ? x : null));
 * ```
 */
export function custom<T>(
  checkValue: (value: unknown) => null | T,
  failureMessage?: string,
): Checker<T>;

export {};
