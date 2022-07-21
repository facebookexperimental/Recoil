/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+recoil
 * @flow strict-local
 * @format
 * @oncall recoil
 */

'use strict';

const {graphql} = require('relay-runtime');

// eslint-disable-next-line fb-www/relay-no-coarse-eslint-disable
/* eslint-disable relay/unused-fields */

const testFeedbackQuery = graphql`
  query RecoilRelayMockQueriesFeedbackQuery($id: ID!)
  # @fb_owner(oncall: "recoil")
  @relay_test_operation {
    feedback(id: $id) {
      id
      seen_count
    }
  }
`;

const testFeedbackSubscription = graphql`
  subscription RecoilRelayMockQueriesFeedbackSubscription(
    $input: FeedbackLikeSubscribeData!
  )
  # @fb_owner(oncall: "recoil")
  @relay_test_operation {
    feedback_like_subscribe(data: $input) {
      ... on FeedbackLikeResponsePayload {
        feedback {
          id
          seen_count
        }
      }
    }
  }
`;

// TODO Find a better mutation example
// eslint-disable-next-line fb-www/relay-mutation-input-name
const testFeedbackMutation = graphql`
  mutation RecoilRelayMockQueriesMutation($data: FeedbackLikeData!)
  # @fb_owner(oncall: "recoil")
  @relay_test_operation
  @raw_response_type {
    feedback_like(data: $data) {
      feedback {
        id
      }
      liker {
        id
      }
    }
  }
`;

const testFeedbackFragment = graphql`
  fragment RecoilRelayMockQueriesFeedbackFragment on Feedback @inline {
    id
    seen_count
  }
`;

const testFeedbackFragmentQuery = graphql`
  query RecoilRelayMockQueriesFeedbackFragmentQuery($id: ID!)
  # @fb_owner(oncall: "recoil")
  @relay_test_operation {
    feedback(id: $id) {
      ...RecoilRelayMockQueriesFeedbackFragment
    }
  }
`;

/* eslint-enable relay/unused-fields */

module.exports = {
  testFeedbackQuery,
  testFeedbackSubscription,
  testFeedbackMutation,
  testFeedbackFragment,
  testFeedbackFragmentQuery,
};
