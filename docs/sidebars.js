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
      'guides/atom-effects',
      'guides/testing',
      'guides/transitions',
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
        Misc: [
          'api-reference/core/useRecoilStoreID',
          'api-reference/core/useRecoilBridgeAcrossReactRoots',
        ],
      },
    ],
  },
  'recoil-sync': [
    'recoil-sync/introduction',
    'recoil-sync/sync-effect',
    'recoil-sync/implement-store',
    'recoil-sync/url-persistence',
    {
      'API Reference': [
        'recoil-sync/api/RecoilSync',
        'recoil-sync/api/syncEffect',
        {
          'URL Persistence': [
            'recoil-sync/api/RecoilURLSync',
            'recoil-sync/api/urlSyncEffect',
            'recoil-sync/api/RecoilURLSyncJSON',
            'recoil-sync/api/RecoilURLSyncTransit',
          ],
        },
      ],
    },
  ],
  refine: [
    'refine/Introduction',
    {
      'API Reference': [
        'refine/api/Utilities',
        'refine/api/Checkers',
        'refine/api/Primitive_Checkers',
        'refine/api/Collection_Checkers',
        'refine/api/Advanced_Checkers',
      ],
    },
  ],
  'recoil-relay': [
    'recoil-relay/introduction',
    'recoil-relay/environment',
    'recoil-relay/graphql-selectors',
    'recoil-relay/preloaded-queries',
    'recoil-relay/graphql-effects',
    {
      'API Reference': [
        'recoil-relay/api/EnvironmentKey',
        'recoil-relay/api/RecoilRelayEnvironment',
        'recoil-relay/api/RecoilRelayEnvironmentProvider',
        'recoil-relay/api/graphQLSelector',
        'recoil-relay/api/graphQLSelectorFamily',
        {
          'Atom Effects': [
            'recoil-relay/api/graphQLQueryEffect',
            'recoil-relay/api/graphQLSubscriptionEffect',
            'recoil-relay/api/graphQLMutationEffect',
          ],
        },
      ],
    },
  ],
};
