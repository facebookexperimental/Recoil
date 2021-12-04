/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict
 * @format
 */

import type {RecoilState, RecoilValueReadOnly} from 'recoil';
import type {TItem} from './Todo_types';

import {atom, selector} from 'recoil';

export const todoListState: RecoilState<Array<TItem>> = atom({
  key: 'todoListState',
  default: [],
});

export const todoListFilterState: RecoilState<string> = atom({
  key: 'todoListFilterState',
  default: 'Show All',
});

export const filteredTodoListState: RecoilValueReadOnly<Array<TItem>> =
  selector({
    key: 'filteredTodoListState',
    get: ({get}) => {
      const filter = get(todoListFilterState);
      const list = get(todoListState);

      switch (filter) {
        case 'Show Completed':
          return list.filter(item => item.isComplete);
        case 'Show Uncompleted':
          return list.filter(item => !item.isComplete);
        default:
          return list;
      }
    },
  });

export const todoListStatsState: RecoilValueReadOnly<{
  percentCompleted: number,
  totalCompletedNum: number,
  totalNum: number,
  totalUncompletedNum: number,
  ...
}> = selector({
  key: 'todoListStatsState',
  get: ({get}) => {
    const todoList = get(todoListState);
    const totalNum = todoList.length;
    const totalCompletedNum = todoList.filter(item => item.isComplete).length;
    const totalUncompletedNum = totalNum - totalCompletedNum;
    const percentCompleted =
      totalNum === 0 ? 0 : (totalCompletedNum / totalNum) * 100;

    return {
      totalNum,
      totalCompletedNum,
      totalUncompletedNum,
      percentCompleted,
    };
  },
});
