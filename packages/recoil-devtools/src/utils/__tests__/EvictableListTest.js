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

const EvictableList = require('../EvictableList');

describe('EvictableList tests', () => {
  const list = new EvictableList<string>(3);
  list.add('a');
  list.add('b');
  list.add('c');
  it('Initializing and add elements', () => {
    expect(list.get(0)).toEqual('a');
    expect(list.get(1)).toEqual('b');
    expect(list.get(2)).toEqual('c');
    expect(list.getSize()).toEqual(3);
    expect(list.getLast()).toEqual(2);
  });

  it('Getting iterators', () => {
    const iterator = list.getIterator();
    const found = [];
    for (const item of iterator) {
      found.push(item);
    }
    expect(found).toEqual(['a', 'b', 'c']);
    expect(list.getArray()).toEqual(found);
  });

  it('Evicting older elements', () => {
    const list = new EvictableList<string>(3);
    list.add('a');
    list.add('b');
    list.add('c');
    list.add('d');
    list.add('e');
    const iterator = list.getIterator();
    const found = [];
    for (const item of iterator) {
      found.push(item);
    }
    expect(found).toEqual(['c', 'd', 'e']);
    expect(list.getArray()).toEqual(found);
    expect(list.get(0)).toEqual(undefined);
    expect(list.get(1)).toEqual(undefined);
    expect(list.get(2)).toEqual('c');
    expect(list.get(3)).toEqual('d');
    expect(list.get(4)).toEqual('e');
    expect(list.getSize()).toEqual(3);
    expect(list.getLast()).toEqual(4);
  });
});

describe('EvictableList find first elements with a condition', () => {
  const list = new EvictableList<number>(3);

  it('find first among added elements', () => {
    list.add(10);
    list.add(15);
    list.add(20);
    expect(list.findFirst(n => n > 8)).toEqual(10);
    expect(list.findFirst(n => n >= 15)).toEqual(15);
    expect(list.findFirst(n => n > 15)).toEqual(20);
    expect(list.findFirst(n => Boolean(n))).toEqual(10);
  });

  it("don't include evicted element in the results", () => {
    list.add(25);
    list.add(30);
    expect(list.findFirst(n => n > 8)).toEqual(20);
    expect(list.findFirst(n => n >= 15)).toEqual(20);
    expect(list.findFirst(n => n > 15)).toEqual(20);
    expect(list.findFirst(n => Boolean(n))).toEqual(20);
    expect(list.findFirst(n => n > 25)).toEqual(30);
  });
});

describe('EvictableList binary search even elements', () => {
  const list = new EvictableList<number>(8);
  list.add(4);
  list.add(8);
  list.add(10);
  list.add(12);
  list.add(15);
  list.add(20);
  list.add(25);
  list.add(30);
  it('find element', () => {
    expect(list.findFirst(n => n >= 2)).toEqual(4);
    expect(list.findFirst(n => n > 4)).toEqual(8);
    expect(list.findFirst(n => n >= 9)).toEqual(10);
    expect(list.findFirst(n => n >= 14)).toEqual(15);
    expect(list.findFirst(n => n >= 28)).toEqual(30);
  });
});

describe('EvictableList binary search with non-full list', () => {
  const list = new EvictableList<number>(8);
  list.add(4);
  list.add(8);
  list.add(10);
  list.add(12);
  it('find element', () => {
    expect(list.findFirst(n => n >= 2)).toEqual(4);
    expect(list.findFirst(n => n > 4)).toEqual(8);
    expect(list.findFirst(n => n >= 9)).toEqual(10);
    expect(list.findFirst(n => n >= 11)).toEqual(12);
  });
});

describe('EvictableList binary search non-full odd elements', () => {
  const list = new EvictableList<number>(9);
  list.add(4);
  list.add(8);
  list.add(10);
  list.add(12);
  list.add(15);
  it('find element', () => {
    expect(list.findFirst(n => n >= 4)).toEqual(4);
    expect(list.findFirst(n => n >= 9)).toEqual(10);
    expect(list.findFirst(n => n >= 11)).toEqual(12);
    expect(list.findFirst(n => n >= 15)).toEqual(15);
  });
});

describe('EvictableList find last elements with a condition', () => {
  const list = new EvictableList<number>(3);

  it('find first among added elements', () => {
    list.add(10);
    list.add(15);
    list.add(20);
    expect(list.findLast(n => n < 8)).toEqual(undefined);
    expect(list.findLast(n => n <= 15)).toEqual(15);
    expect(list.findLast(n => n < 15)).toEqual(10);
    expect(list.findLast(n => n < 100)).toEqual(20);
  });

  it("don't include evicted element in the results", () => {
    list.add(25);
    list.add(30);
    expect(list.findLast(n => n < 8)).toEqual(undefined);
    expect(list.findLast(n => n <= 15)).toEqual(undefined);
    expect(list.findLast(n => n > 15)).toEqual(30);
    expect(list.findLast(n => Boolean(n))).toEqual(30);
    expect(list.findLast(n => n <= 25)).toEqual(25);
  });
});

describe('EvictableList find last binary search even elements', () => {
  const list = new EvictableList<number>(8);
  list.add(4);
  list.add(8);
  list.add(10);
  list.add(12);
  list.add(15);
  list.add(20);
  list.add(25);
  list.add(30);
  it('find element', () => {
    expect(list.findLast(n => n >= 2)).toEqual(30);
    expect(list.findLast(n => n <= 2)).toEqual(undefined);
    expect(list.findLast(n => n < 10)).toEqual(8);
    expect(list.findLast(n => n <= 10)).toEqual(10);
    expect(list.findLast(n => n <= 18)).toEqual(15);
    expect(list.findLast(n => n <= 50)).toEqual(30);
  });
});

describe('EvictableList find last binary search with non-full list', () => {
  const list = new EvictableList<number>(8);
  list.add(4);
  list.add(8);
  list.add(10);
  list.add(12);
  it('find element', () => {
    expect(list.findLast(n => n >= 2)).toEqual(12);
    expect(list.findLast(n => n < 4)).toEqual(undefined);
    expect(list.findLast(n => n <= 4)).toEqual(4);
    expect(list.findLast(n => n <= 9)).toEqual(8);
    expect(list.findLast(n => n <= 12)).toEqual(12);
  });
});

describe('EvictableList find last binary search non-full odd elements', () => {
  const list = new EvictableList<number>(9);
  list.add(4);
  list.add(8);
  list.add(10);
  list.add(12);
  list.add(15);
  it('find element', () => {
    expect(list.findLast(n => n <= 4)).toEqual(4);
    expect(list.findLast(n => n <= 9)).toEqual(8);
    expect(list.findLast(n => n <= 11)).toEqual(10);
    expect(list.findLast(n => n <= 15)).toEqual(15);
  });
});
