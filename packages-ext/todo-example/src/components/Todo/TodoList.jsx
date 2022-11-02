/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall recoil
 */

import {filteredTodoListState} from './Todo_state';
import {TodoItem} from './TodoItem';
import {TodoItemCreator} from './TodoItemCreator';
import {TodoListFilters} from './TodoListFilters';
import {TodoListStats} from './TodoListStats';
import React from 'react';
import {useRecoilValue} from 'recoil';

export const TodoList = () => {
  const todoList = useRecoilValue(filteredTodoListState);

  return (
    <>
      <TodoListStats />
      <TodoListFilters />
      <TodoItemCreator />

      {todoList.map((todoItem, index) => (
        <TodoItem key={todoItem.id} item={todoItem} index={index} />
      ))}
    </>
  );
};
