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

import './App.css';
import {TodoList} from './components/Todo/TodoList';
import React from 'react';
import {RecoilRoot} from 'recoil';

type Props = {};

function App(): React$MixedElement {
  return (
    <RecoilRoot>
      <div className="todo-container">
        <TodoList />
      </div>
    </RecoilRoot>
  );
}

export default App;
