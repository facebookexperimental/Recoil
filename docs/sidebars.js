/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = {
  docs: {
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
    Guides: [
      //   {
      //     'Migrating to Recoil': [
      //       'guides/migrating/from-react-state',
      //       'guides/migrating/from-redux',
      //       'guides/migrating/from-mobx',
      //     ],
      //   },
      'guides/asynchronous-data-queries',
      {
        'Syncing with External State': [
          'guides/atom-effects',
          'guides/recoil-sync',
          'guides/url-persistence',
        ],
      },
      'guides/testing',
      'guides/dev-tools',
      //   'guides/code-splitting',
    ],

    'API Reference': [
      'api-reference/core/RecoilRoot',
      {
        State: [
          'api-reference/core/atom',
          'api-reference/core/selector',
          'api-reference/core/Loadable',
          'api-reference/core/useRecoilState',
          'api-reference/core/useRecoilValue',
          'api-reference/core/useSetRecoilState',
          'api-reference/core/useResetRecoilState',
          'api-reference/core/useRecoilStateLoadable',
          'api-reference/core/useRecoilValueLoadable',
          'api-reference/core/useGetRecoilValueInfo',
          'api-reference/core/useRecoilRefresher',
          'api-reference/core/isRecoilValue',
          // 'api-reference/core/DefaultValue',
        ],
        Utils: [
          'api-reference/utils/atomFamily',
          'api-reference/utils/selectorFamily',
          'api-reference/utils/constSelector',
          'api-reference/utils/errorSelector',
          'api-reference/utils/noWait',
          'api-reference/utils/waitForAll',
          'api-reference/utils/waitForAllSettled',
          'api-reference/utils/waitForNone',
          'api-reference/utils/waitForAny',
        ],
      },
      'api-reference/core/useRecoilTransaction',
      'api-reference/core/useRecoilCallback',
      {
        Snapshots: [
          'api-reference/core/Snapshot',
          'api-reference/core/useRecoilTransactionObserver',
          'api-reference/core/useRecoilSnapshot',
          'api-reference/core/useGotoRecoilSnapshot',
        ],
        'Recoil Sync': [
          'api-reference/recoil-sync/syncEffect',
          'api-reference/recoil-sync/useRecoilSync',
          'api-reference/recoil-sync/RecoilSync',
          {
            'URL Persistence': [
              'api-reference/recoil-sync/RecoilURLSync',
              'api-reference/recoil-sync/useRecoilURLSync',
              'api-reference/recoil-sync/urlSyncEffect',
              {
                JSON: [
                  'api-reference/recoil-sync/RecoilURLSyncJSON',
                  'api-reference/recoil-sync/useRecoilURLSyncJSON',
                ],
              },
              {
                Transit: [
                  'api-reference/recoil-sync/RecoilURLSyncTransit',
                  'api-reference/recoil-sync/useRecoilURLSyncTransit',
                ],
              },
            ],
          },
        ],
        Misc: [
          'api-reference/core/useRecoilStoreID',
          'api-reference/core/useRecoilBridgeAcrossReactRoots',
        ],
      },
    ],
  },
  refine: {
    Introduction: ['refine/Introduction'],
    'API Reference': [
      'refine/api/Utilities',
      'refine/api/Checkers',
      'refine/api/Primitive_Checkers',
      'refine/api/Collection_Checkers',
      'refine/api/Advanced_Checkers',
    ],
  }
};
