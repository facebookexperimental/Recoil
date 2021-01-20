/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// Simple eslint rule that warns on usage of `@fb-only` style comments.
// These comments introduce a split point where code behaves differently
// depending on whether it's run at facebook or in OSS and it's very difficult
// to debug, especially if the person working on that code does not have access
// to facebook's internal code. To minimize that complexity all of these split
// points should be defined in one place and dependency injected in Recoil
// at runtime.

const regexps = [
  [/^.*(@fb-only).*$/, '@fb-only'],
  [/^.*(@oss-only).*$/, '@oss-only'],
];

// If a file paths matches any of provided regular expressions it will be
// excluded from this lint rule.
const excludePaths = [/.*eslint-rules.*/];

module.exports = {
  meta: {
    docs: {
      description: 'disallow @fb-only style comments',
    },
  },
  create: function (context) {
    return {
      // Only match the top level `Program` AST node that represents the entire file.
      Program: function (node) {
        const lines = context.getSourceCode().text.split('\n');
        const filename = context.getFilename();

        if (excludePaths.some(r => r.test(filename))) {
          return;
        }

        lines.forEach((line, lineNumber) => {
          for (const [regexp, descriptor] of regexps) {
            const match = line.match(regexp);

            if (match) {
              context.report({
                message:
                  `Usage of "${descriptor}". Please consider depenedncy injecting this condition ` +
                  `instead. See "${__filename}" for more details`,
                loc: {
                  start: {line: lineNumber + 1, column: 0},
                  end: {line: lineNumber + 1, column: line.length - 1},
                },
              });
            }
          }
        });
      },
    };
  },
};
