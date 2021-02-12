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

const {
  serialize,
  deserialize,
  SerializedValueType,
} = require('../Serialization');

describe('Preparing objects to be sent via postMessage', () => {
  it('string', () => {
    expect(serialize('test')).toEqual({
      t: SerializedValueType.primitive,
      v: 'test',
    });
    expect(serialize('')).toEqual({t: SerializedValueType.primitive, v: ''});
  });
  it('number', () => {
    expect(serialize(90)).toEqual({t: SerializedValueType.primitive, v: 90});
    expect(serialize(-90)).toEqual({
      t: SerializedValueType.primitive,
      v: -90,
    });
  });
  it('boolean', () => {
    expect(serialize(true)).toEqual({
      t: SerializedValueType.primitive,
      v: true,
    });
    expect(serialize(false)).toEqual({
      t: SerializedValueType.primitive,
      v: false,
    });
  });
  it('empty values', () => {
    expect(serialize(null)).toEqual({
      t: SerializedValueType.null,
    });
    expect(serialize(undefined)).toEqual({
      t: SerializedValueType.undefined,
    });
  });
  it('arrays', () => {
    expect(serialize([1, 2, 3])).toEqual({
      t: SerializedValueType.array,
      v: [
        {t: SerializedValueType.primitive, v: 1},
        {t: SerializedValueType.primitive, v: 2},
        {t: SerializedValueType.primitive, v: 3},
      ],
    });
  });
  it('objects', () => {
    expect(serialize({a: 3})).toEqual({
      t: SerializedValueType.object,
      v: [
        [
          {t: SerializedValueType.primitive, v: 'a'},
          {t: SerializedValueType.primitive, v: 3},
        ],
      ],
    });

    expect(serialize({b: new Set([1, 2])})).toEqual({
      t: SerializedValueType.object,
      v: [
        [
          {t: SerializedValueType.primitive, v: 'b'},
          {
            t: SerializedValueType.set,
            v: [
              {t: SerializedValueType.primitive, v: 1},
              {t: SerializedValueType.primitive, v: 2},
            ],
          },
        ],
      ],
    });
  });
  it('dates', () => {
    expect(serialize(new Date(12345678))).toEqual({
      t: SerializedValueType.date,
      v: 12345678,
    });
  });

  it('maps', () => {
    const map = new Map([
      ['test', 1234],
      ['other', 'serialized'],
    ]);

    expect(serialize(map)).toEqual({
      t: SerializedValueType.map,
      v: [
        [
          {
            t: SerializedValueType.primitive,
            v: 'test',
          },
          {
            t: SerializedValueType.primitive,
            v: 1234,
          },
        ],
        [
          {
            t: SerializedValueType.primitive,
            v: 'other',
          },
          {
            t: SerializedValueType.primitive,
            v: 'serialized',
          },
        ],
      ],
    });

    map.set('nested', new Set([9, 2, 3]));

    expect(serialize(map)).toEqual({
      t: SerializedValueType.map,
      v: [
        [
          {
            t: SerializedValueType.primitive,
            v: 'test',
          },
          {
            t: SerializedValueType.primitive,
            v: 1234,
          },
        ],
        [
          {
            t: SerializedValueType.primitive,
            v: 'other',
          },
          {
            t: SerializedValueType.primitive,
            v: 'serialized',
          },
        ],
        [
          {
            t: SerializedValueType.primitive,
            v: 'nested',
          },
          {
            t: SerializedValueType.set,
            v: [
              {
                t: SerializedValueType.primitive,
                v: 9,
              },
              {
                t: SerializedValueType.primitive,
                v: 2,
              },
              {
                t: SerializedValueType.primitive,
                v: 3,
              },
            ],
          },
        ],
      ],
    });

    const nonPrimitiveKeys = new Map();
    nonPrimitiveKeys.set(new Map([[2, 3]]), 'test');
    expect(serialize(nonPrimitiveKeys)).toEqual({
      t: SerializedValueType.map,
      v: [
        [
          {
            t: SerializedValueType.map,
            v: [
              [
                {
                  t: SerializedValueType.primitive,
                  v: 2,
                },
                {
                  t: SerializedValueType.primitive,
                  v: 3,
                },
              ],
            ],
          },
          {
            t: SerializedValueType.primitive,
            v: 'test',
          },
        ],
      ],
    });
  });

  it('sets', () => {
    const set = new Set(['test', 1234]);
    expect(serialize(set)).toEqual({
      t: SerializedValueType.set,
      v: [
        {
          t: SerializedValueType.primitive,
          v: 'test',
        },
        {
          t: SerializedValueType.primitive,
          v: 1234,
        },
      ],
    });
    set.add(new Set([1, 2, 3]));
    expect(serialize(set)).toEqual({
      t: SerializedValueType.set,
      v: [
        {
          t: SerializedValueType.primitive,
          v: 'test',
        },
        {
          t: SerializedValueType.primitive,
          v: 1234,
        },
        {
          t: SerializedValueType.set,
          v: [
            {
              t: SerializedValueType.primitive,
              v: 1,
            },
            {
              t: SerializedValueType.primitive,
              v: 2,
            },
            {
              t: SerializedValueType.primitive,
              v: 3,
            },
          ],
        },
      ],
    });
  });

  it('symbols', () => {
    expect(serialize(Symbol('test'))).toEqual({
      t: SerializedValueType.symbol,
      v: 'test',
    });
  });
  it('errors', () => {
    expect(serialize(new Error('test'))).toEqual({
      t: SerializedValueType.error,
      v: 'Error: test',
    });
    expect(
      serialize(
        new Error(
          'test 1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
        ),
      ),
    ).toEqual({
      t: SerializedValueType.error,
      v:
        'Error: test 123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678 (...)',
    });
  });
});

describe('Restore objects prepared with `serialze`', () => {
  it('string', () => {
    expect(deserialize({t: SerializedValueType.primitive, v: 'test'})).toEqual(
      'test',
    );
    expect(deserialize({t: SerializedValueType.primitive, v: ''})).toEqual('');
  });
  it('number', () => {
    expect(deserialize({t: SerializedValueType.primitive, v: 90})).toEqual(90);
    expect(deserialize({t: SerializedValueType.primitive, v: -90})).toEqual(
      -90,
    );
  });
  it('boolean', () => {
    expect(deserialize({t: SerializedValueType.primitive, v: true})).toEqual(
      true,
    );
    expect(deserialize({t: SerializedValueType.primitive, v: false})).toEqual(
      false,
    );
  });
  it('empty values', () => {
    expect(
      deserialize({
        t: SerializedValueType.null,
      }),
    ).toEqual(null);
    expect(
      deserialize({
        t: SerializedValueType.undefined,
      }),
    ).toEqual(undefined);
  });
  it('arrays', () => {
    expect(
      deserialize({
        t: SerializedValueType.array,
        v: [
          {t: SerializedValueType.primitive, v: 1},
          {t: SerializedValueType.primitive, v: 2},
          {t: SerializedValueType.primitive, v: 3},
        ],
      }),
    ).toEqual([1, 2, 3]);
  });
  it('objects', () => {
    expect(
      deserialize({
        t: SerializedValueType.object,
        v: [
          [
            {t: SerializedValueType.primitive, v: 'a'},
            {t: SerializedValueType.primitive, v: 3},
          ],
        ],
      }),
    ).toEqual({a: 3});
    expect(
      deserialize({
        t: SerializedValueType.object,
        v: [
          [
            {t: SerializedValueType.primitive, v: 'b'},
            {
              t: SerializedValueType.set,
              v: [
                {t: SerializedValueType.primitive, v: 1},
                {t: SerializedValueType.primitive, v: 2},
              ],
            },
          ],
        ],
      }),
    ).toEqual({b: new Set([1, 2])});
  });
  it('dates', () => {
    expect(
      deserialize({
        t: SerializedValueType.date,
        v: 12345678,
      }),
    ).toEqual(new Date(12345678));
  });

  it('maps', () => {
    const map = new Map([
      ['test', 1234],
      ['other', 'serialized'],
    ]);
    expect(
      deserialize({
        t: SerializedValueType.map,
        v: [
          [
            {
              t: SerializedValueType.primitive,
              v: 'test',
            },
            {
              t: SerializedValueType.primitive,
              v: 1234,
            },
          ],
          [
            {
              t: SerializedValueType.primitive,
              v: 'other',
            },
            {
              t: SerializedValueType.primitive,
              v: 'serialized',
            },
          ],
        ],
      }),
    ).toEqual(map);

    map.set('nested', new Set([9, 2, 3]));
    expect(
      deserialize({
        t: SerializedValueType.map,
        v: [
          [
            {
              t: SerializedValueType.primitive,
              v: 'test',
            },
            {
              t: SerializedValueType.primitive,
              v: 1234,
            },
          ],
          [
            {
              t: SerializedValueType.primitive,
              v: 'other',
            },
            {
              t: SerializedValueType.primitive,
              v: 'serialized',
            },
          ],
          [
            {
              t: SerializedValueType.primitive,
              v: 'nested',
            },
            {
              t: SerializedValueType.set,
              v: [
                {
                  t: SerializedValueType.primitive,
                  v: 9,
                },
                {
                  t: SerializedValueType.primitive,
                  v: 2,
                },
                {
                  t: SerializedValueType.primitive,
                  v: 3,
                },
              ],
            },
          ],
        ],
      }),
    ).toEqual(map);

    const nonPrimitiveKeys = new Map();
    nonPrimitiveKeys.set(new Map([[2, 3]]), 'test');
    expect(
      deserialize({
        t: SerializedValueType.map,
        v: [
          [
            {
              t: SerializedValueType.map,
              v: [
                [
                  {
                    t: SerializedValueType.primitive,
                    v: 2,
                  },
                  {
                    t: SerializedValueType.primitive,
                    v: 3,
                  },
                ],
              ],
            },
            {
              t: SerializedValueType.primitive,
              v: 'test',
            },
          ],
        ],
      }),
    ).toEqual(nonPrimitiveKeys);
  });

  it('sets', () => {
    const set = new Set(['test', 1234]);
    expect(
      deserialize({
        t: SerializedValueType.set,
        v: [
          {
            t: SerializedValueType.primitive,
            v: 'test',
          },
          {
            t: SerializedValueType.primitive,
            v: 1234,
          },
        ],
      }),
    ).toEqual(set);
    set.add(new Set([1, 2, 3]));
    expect(
      deserialize({
        t: SerializedValueType.set,
        v: [
          {
            t: SerializedValueType.primitive,
            v: 'test',
          },
          {
            t: SerializedValueType.primitive,
            v: 1234,
          },
          {
            t: SerializedValueType.set,
            v: [
              {
                t: SerializedValueType.primitive,
                v: 1,
              },
              {
                t: SerializedValueType.primitive,
                v: 2,
              },
              {
                t: SerializedValueType.primitive,
                v: 3,
              },
            ],
          },
        ],
      }),
    ).toEqual(set);
  });

  it('Symbol', () => {
    const symbol = ((deserialize({
      t: SerializedValueType.symbol,
      v: 'test',
    }): any): Symbol);
    expect(typeof symbol).toEqual('symbol');
    expect(symbol.description).toEqual('test');
  });

  it('errors', () => {
    expect(
      deserialize({
        t: SerializedValueType.error,
        v: 'Error: test',
      }),
    ).toEqual('Error: test');
  });
});

describe('Serializing circular references', () => {
  const data = {a: 2, c: {}};
  data.c = data;
  it('avoid circular references in first level keys', () => {
    expect(serialize(data)).toEqual({
      t: SerializedValueType.object,
      v: [
        [
          {t: SerializedValueType.primitive, v: 'a'},
          {t: SerializedValueType.primitive, v: 2},
        ],
        [
          {t: SerializedValueType.primitive, v: 'c'},
          {t: SerializedValueType.primitive, v: '[Circular Reference]'},
        ],
      ],
    });
  });
});

describe('Serializing nested circular references', () => {
  const data = {a: 2, c: {}};
  data.c = {a: 2, c: data};

  it('avoid circular references in nested objects (only by reference)', () => {
    expect(serialize(data)).toEqual({
      t: SerializedValueType.object,
      v: [
        [
          {t: SerializedValueType.primitive, v: 'a'},
          {t: SerializedValueType.primitive, v: 2},
        ],
        [
          {t: SerializedValueType.primitive, v: 'c'},
          {
            t: SerializedValueType.object,
            v: [
              [
                {t: SerializedValueType.primitive, v: 'a'},
                {t: SerializedValueType.primitive, v: 2},
              ],
              [
                {t: SerializedValueType.primitive, v: 'c'},
                {t: SerializedValueType.primitive, v: '[Circular Reference]'},
              ],
            ],
          },
        ],
      ],
    });
  });
});

describe('Serializing circular references within arrays and sets', () => {
  const data = [];
  const b = [data];
  data.push(b);

  it('avoid circular references in nested objects (only by reference)', () => {
    expect(serialize(data)).toEqual({
      t: SerializedValueType.array,
      v: [
        {
          t: SerializedValueType.array,
          v: [{t: SerializedValueType.primitive, v: '[Circular Reference]'}],
        },
      ],
    });
  });

  const set = new Set();
  const c = new Set();
  c.add(set);
  set.add(c);

  it('avoid circular references in nested objects (only by reference)', () => {
    expect(serialize(set)).toEqual({
      t: SerializedValueType.set,
      v: [
        {
          t: SerializedValueType.set,
          v: [{t: SerializedValueType.primitive, v: '[Circular Reference]'}],
        },
      ],
    });
  });
});

describe('serialize object with depth greater than allowed', () => {
  const data = {
    '1': {
      '2': {
        '3': {
          '4': {
            '5': {
              '6': {
                '7': {t: 2},
              },
            },
          },
        },
      },
    },
  };
  it('more than 5 levels', () => {
    expect(serialize(data)).toEqual({
      t: SerializedValueType.object,
      v: [
        [
          {
            t: SerializedValueType.primitive,
            v: '1',
          },
          {
            t: SerializedValueType.object,
            v: [
              [
                {
                  t: SerializedValueType.primitive,
                  v: '2',
                },
                {
                  t: SerializedValueType.object,
                  v: [
                    [
                      {
                        t: SerializedValueType.primitive,
                        v: '3',
                      },
                      {
                        t: SerializedValueType.object,
                        v: [
                          [
                            {
                              t: SerializedValueType.primitive,
                              v: '4',
                            },
                            {
                              t: SerializedValueType.object,
                              v: [
                                [
                                  {
                                    t: SerializedValueType.primitive,
                                    v: '5',
                                  },
                                  {
                                    t: SerializedValueType.object,
                                    v: [
                                      [
                                        {
                                          t: SerializedValueType.primitive,
                                          v: '[Max Depth Reached]',
                                        },
                                        {
                                          t: SerializedValueType.primitive,
                                          v: '[Max Depth Reached]',
                                        },
                                      ],
                                    ],
                                  },
                                ],
                              ],
                            },
                          ],
                        ],
                      },
                    ],
                  ],
                },
              ],
            ],
          },
        ],
      ],
    });
  });

  it('Reducing maxDepth to 1 level', () => {
    expect(serialize(data, 1)).toEqual({
      t: SerializedValueType.object,
      v: [
        [
          {
            t: SerializedValueType.primitive,
            v: '1',
          },
          {
            t: SerializedValueType.object,
            v: [
              [
                {
                  t: SerializedValueType.primitive,
                  v: '[Max Depth Reached]',
                },
                {
                  t: SerializedValueType.primitive,
                  v: '[Max Depth Reached]',
                },
              ],
            ],
          },
        ],
      ],
    });
  });
});

describe('limiting number of items', () => {
  const data = ['1', '2', '3', '4', '5'];
  expect(serialize(data, 1, 1)).toEqual({
    t: SerializedValueType.array,
    v: [
      {
        t: SerializedValueType.primitive,
        v: '1',
      },
    ],
    e: 4,
  });

  expect(serialize(data, 1, 2)).toEqual({
    t: SerializedValueType.array,
    v: [
      {
        t: SerializedValueType.primitive,
        v: '1',
      },
      {
        t: SerializedValueType.primitive,
        v: '2',
      },
    ],
    e: 3,
  });

  const set = new Set(data);
  expect(serialize(set, 1, 1)).toEqual({
    t: SerializedValueType.set,
    v: [
      {
        t: SerializedValueType.primitive,
        v: '1',
      },
    ],
    e: 4,
  });

  expect(serialize(set, 1, 2)).toEqual({
    t: SerializedValueType.set,
    v: [
      {
        t: SerializedValueType.primitive,
        v: '1',
      },
      {
        t: SerializedValueType.primitive,
        v: '2',
      },
    ],
    e: 3,
  });

  const map = new Map();
  map.set(1, '1');
  map.set(2, '2');
  map.set(3, '3');
  map.set(4, '4');
  map.set(5, '5');
  expect(serialize(map, 1, 1)).toEqual({
    t: SerializedValueType.map,
    v: [
      [
        {
          t: SerializedValueType.primitive,
          v: 1,
        },
        {
          t: SerializedValueType.primitive,
          v: '1',
        },
      ],
    ],
    e: 4,
  });
  expect(serialize(map, 1, 2)).toEqual({
    t: SerializedValueType.map,
    v: [
      [
        {
          t: SerializedValueType.primitive,
          v: 1,
        },
        {
          t: SerializedValueType.primitive,
          v: '1',
        },
      ],
      [
        {
          t: SerializedValueType.primitive,
          v: 2,
        },
        {
          t: SerializedValueType.primitive,
          v: '2',
        },
      ],
    ],
    e: 3,
  });

  const obj = {
    a: [1, 2, 3],
    b: 'test',
  };
  expect(serialize(obj, 2, 1)).toEqual({
    t: SerializedValueType.object,
    v: [
      [
        {
          t: SerializedValueType.primitive,
          v: 'a',
        },
        {
          t: SerializedValueType.array,
          v: [
            {
              t: SerializedValueType.primitive,
              v: 1,
            },
          ],
          e: 2,
        },
      ],
    ],
    e: 1,
  });
});
