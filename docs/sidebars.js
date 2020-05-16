/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = {
  someSidebar: {
    Introduction: [
      'introduction/motivation',
      'introduction/core-concepts',
      'introduction/installation',
      'introduction/getting-started',
    ],
    'Basic Tutorial': [
      'basic-tutorial/intro',
      'basic-tutorial/atoms',
      'basic-tutorial/selectors',
      // 'basic-tutorial/demo',
      // 'basic-tutorial/performance',
    ],
    // Guides: [
    //   {
    //     'Migrating to Recoil': [
    //       'guides/migrating/from-react-state',
    //       'guides/migrating/from-redux',
    //       'guides/migrating/from-mobx',
    //     ],
    //   },
    //   'guides/usage-flow',
    //   'guides/usage-typescript',
    //   'guides/writing-test',
    //   'guides/code-splitting',
    // ],
    'API Reference': [
      {
        Core: [
          'api-reference/core/RecoilRoot',
          'api-reference/core/atom',
          'api-reference/core/selector',
          'api-reference/core/isRecoilValue',
          // 'api-reference/core/DefaultValue',
          {
            Hooks: [
              'api-reference/core/useRecoilState',
              'api-reference/core/useRecoilValue',
              'api-reference/core/useSetRecoilState',
              'api-reference/core/useResetRecoilState',
              'api-reference/core/useRecoilValueLoadable',
              'api-reference/core/useRecoilStateLoadable',
              'api-reference/core/useRecoilCallback',
            ],
          },
        ],
      },
      {
        Utils: [
          'api-reference/utils/atomFamily',
        //   'api-reference/utils/constSelector',
        //   'api-reference/utils/errorSelector',
        //   'api-reference/utils/noWait',
        //   'api-reference/utils/selectorFamily',
        //   'api-reference/utils/waitForAll',
        //   'api-reference/utils/waitForAny',
        //   'api-reference/utils/waitForNone',
        ],
      },
    ],
  },
};
