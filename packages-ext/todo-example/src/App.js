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
