/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */

import './App.css';
import {TodoList} from './components/Todo/TodoList';
import React from 'react';
import {RecoilRoot} from 'recoil';

function App() {
  return (
    <RecoilRoot>
      <div className="todo-container">
        <TodoList />
      </div>
    </RecoilRoot>
  );
}

export default App;
