/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const HashTable = require('../TXHashtable');

describe('Timestamp hashtable', () => {
  const hash = new HashTable<number>();
  it('creates object with methods', () => {
    expect(hash).toBeDefined();
    expect(hash.get).toBeDefined();
    expect(hash.getSnapshot).toBeDefined();
    expect(hash.set).toBeDefined();
  });

  it('get empty snapshot before transactions', () => {
    expect(hash.getSnapshot(0)).toEqual({});
  });

  it('simple set', () => {
    hash.set('test', 99, 5);
    expect(hash.get('test')).toEqual(99);
    expect(hash.get('test', 5)).toEqual(99);
    expect(hash.get('test', 7)).toEqual(99);
    expect(hash.get('test', 2)).toEqual(undefined);
  });

  it('adding values for same key', () => {
    hash.set('test', 199, 10);
    expect(hash.get('test')).toEqual(199);
    expect(hash.get('test', 5)).toEqual(99);
    expect(hash.get('test', 7)).toEqual(99);
    expect(hash.get('test', 2)).toEqual(undefined);
    expect(hash.get('test', 10)).toEqual(199);
    expect(hash.get('test', 12)).toEqual(199);
  });

  it('get latest snapshot', () => {
    hash.set('other', 199, 7);
    expect(hash.getSnapshot()).toEqual({other: 199, test: 199});
  });

  it('get timed snapshot', () => {
    expect(hash.getSnapshot(7)).toEqual({other: 199, test: 99});
  });

  it('get timed snapshot with missing keys', () => {
    expect(hash.getSnapshot(5)).toEqual({test: 99});
  });
});
