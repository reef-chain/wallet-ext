// Adapted from @polkadot/extension-base (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from "@polkadot/util/types";

import { PORT_EXTENSION } from "../extension-base/defaults";
import {
  AccountJson,
  AuthorizeRequest,
  MessageTypes,
  MessageTypesWithNoSubscriptions,
  MessageTypesWithNullRequest,
  MessageTypesWithSubscriptions,
  MetadataRequest,
  RequestTypes,
  ResponseAuthorizeList,
  ResponseSigningIsLocked,
  ResponseTypes,
  SigningRequest,
  SubscriptionMessageTypes,
} from "../extension-base/background/types";
import { metadataExpand } from "../chains";
import { Chain } from "../chains/types";
import { Message } from "../extension-base/types";
import { getSavedMeta, setSavedMeta } from "./MetadataCache";
import { AvailableNetwork } from "../config";

interface Handler {
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  subscriber?: (data: any) => void;
}

type Handlers = Record<string, Handler>;

let port: chrome.runtime.Port;

const handlers: Handlers = {};
let idCounter = 0;

const connect = (): chrome.runtime.Port => {
  port = chrome.runtime.connect({ name: PORT_EXTENSION });
  port.onDisconnect.addListener(connect); // force reconnect

  // setup a listener for messages, any incoming resolves the promise
  port.onMessage.addListener((data: Message["data"]): void => {
    const handler = handlers[data.id];

    if (!handler) {
      console.error(`Unknown response: ${JSON.stringify(data)}`);
      return;
    }

    if (!handler.subscriber) {
      delete handlers[data.id];
    }

    if (data.subscription) {
      (handler.subscriber as Function)(data.subscription);
    } else if (data.error) {
      handler.reject(new Error(data.error));
    } else {
      handler.resolve(data.response);
    }
  });

  return port;
};

port = connect();

export function sendMessage<TMessageType extends MessageTypesWithNullRequest>(
  message: TMessageType
): Promise<ResponseTypes[TMessageType]>;
export function sendMessage<
  TMessageType extends MessageTypesWithNoSubscriptions
>(
  message: TMessageType,
  request: RequestTypes[TMessageType]
): Promise<ResponseTypes[TMessageType]>;
export function sendMessage<TMessageType extends MessageTypesWithSubscriptions>(
  message: TMessageType,
  request: RequestTypes[TMessageType],
  subscriber: (data: SubscriptionMessageTypes[TMessageType]) => void
): Promise<ResponseTypes[TMessageType]>;

export function sendMessage<TMessageType extends MessageTypes>(
  message: TMessageType,
  request?: RequestTypes[TMessageType],
  subscriber?: (data: unknown) => void
): Promise<ResponseTypes[TMessageType]> {
  return new Promise((resolve, reject): void => {
    const id = `${Date.now()}.${++idCounter}`;

    handlers[id] = { reject, resolve, subscriber };

    port.postMessage({ id, message, request: request || {} });
  });
}

export async function getDetachedWindowId(): Promise<number> {
  return sendMessage("pri(detached.window.get)", null);
}

export async function setDetachedWindowId(id: number): Promise<boolean> {
  return sendMessage("pri(detached.window.set)", { id });
}

// Metadata

export async function approveMetaRequest(id: string): Promise<boolean> {
  return sendMessage("pri(metadata.approve)", { id });
}

export async function getMetadata(
  genesisHash?: string | null,
  isPartial = false
): Promise<Chain | null> {
  if (!genesisHash) {
    return null;
  }

  let request = getSavedMeta(genesisHash);

  if (!request) {
    request = sendMessage("pri(metadata.get)", genesisHash || null);
    setSavedMeta(genesisHash, request);
  }

  const def = await request;

  if (def) {
    return metadataExpand(def, isPartial);
  }

  return null;
}

export async function rejectMetaRequest(id: string): Promise<boolean> {
  return sendMessage("pri(metadata.reject)", { id });
}

export async function subscribeMetadataRequests(
  cb: (accounts: MetadataRequest[]) => void
): Promise<boolean> {
  return sendMessage("pri(metadata.requests)", null, cb);
}

// Accounts

export async function createAccountSuri(
  name: string,
  password: string,
  suri: string,
  genesisHash?: HexString,
): Promise<boolean> {
  return sendMessage("pri(accounts.create.suri)", {
    name,
    password,
    suri,
    genesisHash,
  });
}

export async function editAccount(
  address: string,
  name: string
): Promise<boolean> {
  return sendMessage("pri(accounts.edit)", { address, name });
}

export async function forgetAccount(address: string): Promise<boolean> {
  return sendMessage("pri(accounts.forget)", { address });
}

export async function subscribeAccounts(
  cb: (accounts: AccountJson[]) => void
): Promise<boolean> {
  return sendMessage("pri(accounts.subscribe)", null, cb);
}

export async function selectAccount(address: string): Promise<boolean> {
  return sendMessage("pri(accounts.select)", { address });
}

export async function subscribeSelectedAccount(
  cb: (selected: AccountJson | undefined) => void
): Promise<boolean> {
  return subscribeAccounts((accounts) => {
    cb(accounts.find((a) => a.isSelected));
  });
}

// Network

export async function selectNetwork(
  networkId: AvailableNetwork
): Promise<boolean> {
  return sendMessage("pri(network.select)", { networkId });
}

export async function subscribeNetwork(
  cb: (network: AvailableNetwork) => void
): Promise<boolean> {
  return sendMessage("pri(network.subscribe)", null, cb);
}

// Signing

export async function cancelSignRequest(id: string): Promise<boolean> {
  return sendMessage("pri(signing.cancel)", { id });
}

export async function isSignLocked(
  id: string
): Promise<ResponseSigningIsLocked> {
  return sendMessage("pri(signing.isLocked)", { id });
}

export async function approveSignRequest(
  id: string,
  savePass: boolean,
  password?: string
): Promise<boolean> {
  return sendMessage("pri(signing.approve)", { id, password, savePass });
}

export async function subscribeSigningRequests(
  cb: (accounts: SigningRequest[]) => void
): Promise<boolean> {
  return sendMessage("pri(signing.requests)", null, (val) => {
    cb(val);
  });
}

// Authorize

export async function getAuthList(): Promise<ResponseAuthorizeList> {
  return sendMessage("pri(authorize.list)");
}

export async function approveAuthRequest(id: string): Promise<boolean> {
  return sendMessage("pri(authorize.approve)", { id });
}

export async function rejectAuthRequest(id: string): Promise<boolean> {
  return sendMessage("pri(authorize.reject)", { id });
}

export async function subscribeAuthorizeRequests(
  cb: (accounts: AuthorizeRequest[]) => void
): Promise<boolean> {
  return sendMessage("pri(authorize.requests)", null, cb);
}

export async function toggleAuthorization(
  url: string
): Promise<ResponseAuthorizeList> {
  return sendMessage("pri(authorize.toggle)", url);
}

export async function removeAuthorization(
  url: string
): Promise<ResponseAuthorizeList> {
  return sendMessage("pri(authorize.remove)", url);
}
