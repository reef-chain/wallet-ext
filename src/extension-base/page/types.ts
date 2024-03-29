// Adapted from @polkadot/extension-base (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import type { MessageTypesWithNoSubscriptions, MessageTypesWithNullRequest, MessageTypesWithSubscriptions, RequestTypes, ResponseTypes, SubscriptionMessageTypes } from '../background/types';

export interface SendRequest {
  <TMessageType extends MessageTypesWithNullRequest>(message: TMessageType): Promise<ResponseTypes[TMessageType]>;
  <TMessageType extends MessageTypesWithNoSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType]): Promise<ResponseTypes[TMessageType]>;
  <TMessageType extends MessageTypesWithSubscriptions>(message: TMessageType, request: RequestTypes[TMessageType], subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void): Promise<ResponseTypes[TMessageType]>;
}
