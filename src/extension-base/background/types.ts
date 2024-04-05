// Adapted from @polkadot/extension (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair, KeyringPair$Json } from "@polkadot/keyring/types";
import type { JsonRpcResponse } from "@polkadot/rpc-provider/types";
import type {
  SignerPayloadJSON,
  SignerPayloadRaw,
} from "@polkadot/types/types";
import type { HexString } from "@polkadot/util/types";
import { TypeRegistry } from "@polkadot/types";
import { KeyringPairs$Json } from "@polkadot/ui-keyring/types";
import { extension as extLib } from "@reef-chain/util-lib";

import { AvailableNetwork } from "../../config";
import { AuthUrls } from "./handlers/State";

// [MessageType]: [RequestType, ResponseType, SubscriptionMessageType?]
export interface RequestSignatures {
  // private/internal requests, i.e. from a popup
  "pri(detached.window.get)": [null, number];
  "pri(detached.window.set)": [DetachedWindowRequest, boolean];
  "pri(metadata.approve)": [RequestMetadataApprove, boolean];
  "pri(metadata.get)": [string | null, extLib.MetadataDef | null];
  "pri(metadata.reject)": [RequestMetadataReject, boolean];
  "pri(metadata.requests)": [
    RequestMetadataSubscribe,
    boolean,
    MetadataRequest[]
  ];
  "pri(metadata.list)": [null, extLib.MetadataDef[]];
  "pri(seed.create)": [null, ResponseSeedCreate];
  "pri(seed.validate)": [string, ResponseSeedCreate];
  "pri(accounts.create.suri)": [RequestAccountCreateSuri, boolean];
  "pri(accounts.changePassword)": [RequestAccountChangePassword, boolean];
  "pri(accounts.edit)": [RequestAccountEdit, boolean];
  "pri(json.restore)": [RequestJsonRestore, void];
  "pri(json.batchRestore)": [RequestBatchRestore, void];
  "pri(accounts.export)": [RequestAccountExport, KeyringPair$Json];
  "pri(accounts.exportAll)": [string, ResponseAccountsExport];
  "pri(accounts.forget)": [RequestAccountForget, boolean];
  "pri(accounts.select)": [RequestAccountSelect, boolean];
  "pri(accounts.subscribe)": [
    RequestAccountSubscribe,
    boolean,
    extLib.AccountJson[]
  ];
  "pri(network.subscribe)": [RequestNetworkSubscribe, boolean, string];
  "pri(network.select)": [RequestNetworkSelect, boolean];
  "pri(signing.cancel)": [RequestSigningCancel, boolean];
  "pri(signing.approve)": [RequestSigningApprove, boolean];
  "pri(signing.requests)": [RequestSigningSubscribe, boolean, SigningRequest[]];
  "pri(signing.isLocked)": [RequestSigningIsLocked, ResponseSigningIsLocked];
  "pri(authorize.list)": [null, ResponseAuthorizeList];
  "pri(authorize.approve)": [RequestAuthorizeApprove, boolean];
  "pri(authorize.reject)": [RequestAuthorizeReject, boolean];
  "pri(authorize.requests)": [
    RequestAuthorizeSubscribe,
    boolean,
    AuthorizeRequest[]
  ];
  "pri(authorize.toggle)": [string, ResponseAuthorizeList];
  "pri(authorize.remove)": [string, ResponseAuthorizeList];
  // public/external requests, i.e. from a page
  "pub(accounts.list)": [null, extLib.InjectedAccount[]];
  "pub(accounts.subscribe)": [
    RequestAccountSubscribe,
    boolean,
    extLib.InjectedAccount[]
  ];
  "pub(authorize.tab)": [RequestAuthorizeTab, null];
  "pub(bytes.sign)": [SignerPayloadRaw, ResponseSigning];
  "pub(extrinsic.sign)": [SignerPayloadJSON, ResponseSigning];
  "pub(metadata.list)": [null, extLib.InjectedMetadataKnown[]];
  "pub(metadata.provide)": [extLib.MetadataDef, boolean];
  "pub(phishing.redirectIfDenied)": [null, boolean];
  "pub(rpc.listProviders)": [void, ResponseRpcListProviders];
  "pub(rpc.send)": [RequestRpcSend, JsonRpcResponse<any>];
  "pub(rpc.startProvider)": [string, extLib.ProviderMeta];
  "pub(rpc.subscribe)": [RequestRpcSubscribe, number, JsonRpcResponse<any>];
  "pub(rpc.subscribeConnected)": [null, boolean, boolean];
  "pub(network.subscribe)": [RequestNetworkSubscribe, boolean, string];
}

type KeysWithDefinedValues<T> = {
  [K in keyof T]: T[K] extends undefined ? never : K;
}[keyof T];

export type NoUndefinedValues<T> = {
  [K in KeysWithDefinedValues<T>]: T[K];
};

type IsNull<T, K extends keyof T> = {
  [K1 in Exclude<keyof T, K>]: T[K1];
} & T[K] extends null
  ? K
  : never;

type NullKeys<T> = { [K in keyof T]: IsNull<T, K> }[keyof T];

export type MessageTypes = keyof RequestSignatures;

// Requests

export type RequestTypes = {
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][0];
};

export type MessageTypesWithNullRequest = NullKeys<RequestTypes>;

export interface TransportRequestMessage<TMessageType extends MessageTypes> {
  id: string;
  message: TMessageType;
  origin: "reef_page" | "reef_extension";
  request: RequestTypes[TMessageType];
}

export interface DetachedWindowRequest {
  id: number;
}

export interface AuthorizeRequest {
  id: string;
  request: RequestAuthorizeTab;
  url: string;
}

export interface MetadataRequest {
  id: string;
  request: extLib.MetadataDef;
  url: string;
}

export interface ResponseAccountsExport {
  exportedJson: KeyringPairs$Json;
}

export interface SigningRequest {
  account: extLib.AccountJson;
  id: string;
  request: RequestSign;
  url: string;
}

export interface RequestSigningIsLocked {
  id: string;
}

export interface RequestAccountSelect {
  address: string;
}

export interface RequestNetworkSelect {
  networkId: AvailableNetwork;
}

export interface RequestAuthorizeTab {
  origin: string;
}

export interface RequestAuthorizeApprove {
  id: string;
}

export interface RequestAuthorizeReject {
  id: string;
}

export type RequestAuthorizeSubscribe = null;

export type RequestNetworkSubscribe = null;

export interface RequestMetadataApprove {
  id: string;
}

export interface RequestMetadataReject {
  id: string;
}

export type RequestMetadataSubscribe = null;

export interface RequestAccountCreateSuri {
  name: string;
  password: string;
  suri: string;
}

export interface RequestAccountChangePassword {
  address: string;
  oldPass: string;
  newPass: string;
}

export interface RequestAccountEdit {
  address: string;
  genesisHash?: HexString | null;
  name: string;
}

export interface RequestJsonRestore {
  file: KeyringPair$Json;
  password: string;
}

export interface RequestBatchRestore {
  file: KeyringPairs$Json;
  password: string;
}

export interface RequestAccountExport {
  address: string;
  password: string;
}

export interface RequestAccountForget {
  address: string;
}

export type RequestAccountSubscribe = null;

export interface RequestRpcSend {
  method: string;
  params: unknown[];
}

export interface RequestRpcSubscribe extends RequestRpcSend {
  type: string;
}

export interface RequestRpcUnsubscribe {
  method: string;
  subscriptionId: number | string;
  type: string;
}

export interface RequestSigningApprove {
  id: string;
  password?: string;
  savePass: boolean;
}

export interface RequestSigningCancel {
  id: string;
}

export type RequestSigningSubscribe = null;

// Responses

export type ResponseTypes = {
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][1];
};

export type ResponseType<TMessageType extends keyof RequestSignatures> =
  RequestSignatures[TMessageType][1];

interface TransportResponseMessageSub<
  TMessageType extends MessageTypesWithSubscriptions
> {
  error?: string;
  id: string;
  response?: ResponseTypes[TMessageType] | ResponseTypes[TMessageType];
  subscription?:
    | SubscriptionMessageTypes[TMessageType]
    | SubscriptionMessageTypes[TMessageType];
}

interface TransportResponseMessageNoSub<
  TMessageType extends MessageTypesWithNoSubscriptions
> {
  error?: string;
  id: string;
  response?: ResponseTypes[TMessageType];
}

export type TransportResponseMessage<TMessageType extends MessageTypes> =
  TMessageType extends MessageTypesWithNoSubscriptions
    ? TransportResponseMessageNoSub<TMessageType>
    : TMessageType extends MessageTypesWithSubscriptions
    ? TransportResponseMessageSub<TMessageType>
    : never;

export interface ResponseSeedCreate {
  address: string;
  seed: string;
}

export interface ResponseSigning {
  id: string;
  signature: HexString;
}

export interface ResponseSigningIsLocked {
  isLocked: boolean;
  remainingTime: number;
}

export type ResponseRpcListProviders = extLib.ProviderList;

// Subscriptions

export type SubscriptionMessageTypes = NoUndefinedValues<{
  [MessageType in keyof RequestSignatures]: RequestSignatures[MessageType][2];
}>;

export type MessageTypesWithSubscriptions = keyof SubscriptionMessageTypes;
export type MessageTypesWithNoSubscriptions = Exclude<
  MessageTypes,
  keyof SubscriptionMessageTypes
>;

export interface RequestSign {
  readonly payload: SignerPayloadJSON | SignerPayloadRaw;

  sign(registry: TypeRegistry, pair: KeyringPair): { signature: HexString };
}

export interface ResponseAuthorizeList {
  list: AuthUrls;
}
