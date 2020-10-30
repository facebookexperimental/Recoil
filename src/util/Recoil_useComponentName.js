/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 */
'use strict';

const {useRef} = require('React');

const gkx = require('../util/Recoil_gkx');
const stackTraceParser = require('../util/Recoil_stackTraceParser');

function useComponentName(): string {
  const nameRef = useRef();
  if (__DEV__) {
    if (gkx('recoil_infer_component_names')) {
      if (nameRef.current === undefined) {
        // There is no blessed way to determine the calling React component from
        // within a hook. This hack uses the fact that hooks must start with 'use'
        // and that hooks are either called by React Components or other hooks. It
        // follows therefore, that to find the calling component, you simply need
        // to look down the stack and find the first function which doesn't start
        // with 'use'. We are only enabling this in dev for now, since once the
        // codebase is minified, the naming assumptions no longer hold true.

        const frames = stackTraceParser(new Error().stack);
        for (const {methodName} of frames) {
          // I observed cases where the frame was of the form 'Object.useXXX'
          // hence why I'm searching for hooks following a word boundary
          if (!methodName.match(/\buse[^\b]+$/)) {
            return (nameRef.current = methodName);
          }
        }
        nameRef.current = null;
      }
      return nameRef.current ?? '<unable to determine component name>';
    }
  }
  // @fb-only: return "<component name only available when both in dev mode and when passing GK 'recoil_infer_component_names'>";
  return '<component name not available>'; // @oss-only
}

module.exports = useComponentName;
