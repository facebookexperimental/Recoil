/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

import React from 'react';
import {useRecoilValue} from 'recoil';

import {filteredTodoListState} from './Todo_state';
import {TodoItemCreator} from './TodoItemCreator';
import {TodoItem} from './TodoItem';
import {TodoListStats} from './TodoListStats';
import {TodoListFilters} from './TodoListFilters';

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
