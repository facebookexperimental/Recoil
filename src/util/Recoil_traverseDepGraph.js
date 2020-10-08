/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Utility for traversing the dependency graph starting at some key.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

import type {Graph} from '../core/Recoil_Graph';
import type {NodeKey} from '../core/Recoil_State';

type DepGraph = $PropertyType<Graph, 'nodeDeps'>;

type VisitInfo = $ReadOnly<{
  key: NodeKey,
  deps: $ReadOnlySet<NodeKey>,
}>;

type OnVisit = VisitInfo => ?StopTraversing;

opaque type StopTraversing = string;

export default function traverseDepGraph(
  depGraph: DepGraph,
  initialKeys: Array<NodeKey>,
  onVisit: OnVisit,
): void {
  const visitedNodes = new Set();
  const stack = [...initialKeys];

  while (stack.length) {
    const key = stack.pop();
    const deps = depGraph.get(key) ?? new Set();

    if (!visitedNodes.has(key)) {
      const res = onVisit({key, deps});

      if (res === traverseDepGraph.STOP_TRAVERSING) {
        return;
      }

      visitedNodes.add(key);
    }

    deps.forEach(depKey => {
      if (!visitedNodes.has(depKey)) {
        stack.push(depKey);
      }
    });
  }
}

traverseDepGraph.STOP_TRAVERSING = ('__stopTraversing': StopTraversing);
