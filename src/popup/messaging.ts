// Adapted from @polkadot/extension-base (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair$Json } from "@polkadot/keyring/types";
import { KeyringPairs$Json } from "@polkadot/ui-keyring/types";
import { extension as extLib } from "@reef-chain/util-lib";

import { PORT_EXTENSION } from "../extension-base/defaults";
import {
  AuthorizeRequest,
  MessageTypes,
  MessageTypesWithNoSubscriptions,
  MessageTypesWithNullRequest,
  MessageTypesWithSubscriptions,
  MetadataRequest,
  RequestTypes,
  ResponseAuthorizeList,
  ResponseDeriveValidate,
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

const connect = () => {
  port = chrome.runtime.connect({ name: PORT_EXTENSION });

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
};

connect();

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

export async function createSeed(): Promise<{ address: string; seed: string }> {
  return sendMessage("pri(seed.create)");
}

export async function validateSeed(
  seed: string
): Promise<{ address: string; seed: string }> {
  return sendMessage("pri(seed.validate)", seed);
}

export async function createAccountHardware(
  address: string,
  hardwareType: string,
  accountIndex: number,
  addressOffset: number,
  name: string
): Promise<boolean> {
  return sendMessage("pri(accounts.create.hardware)", {
    accountIndex,
    address,
    addressOffset,
    hardwareType,
    name,
  });
}

export async function createAccountSuri(
  name: string,
  password: string,
  suri: string
): Promise<boolean> {
  return sendMessage("pri(accounts.create.suri)", {
    name,
    password,
    suri,
  });
}

export async function editAccount(
  address: string,
  name: string
): Promise<boolean> {
  return sendMessage("pri(accounts.edit)", { address, name });
}

export async function exportAccount(
  address: string,
  password: string
): Promise<KeyringPair$Json> {
  return sendMessage("pri(accounts.export)", { address, password });
}

export async function exportAllAccounts(
  password: string
): Promise<{ exportedJson: KeyringPairs$Json }> {
  return sendMessage("pri(accounts.exportAll)", password);
}

export async function jsonRestore(
  file: KeyringPair$Json,
  password: string
): Promise<void> {
  return sendMessage("pri(json.restore)", { file, password });
}

export async function batchRestore(
  file: KeyringPairs$Json,
  password: string
): Promise<void> {
  return sendMessage("pri(json.batchRestore)", { file, password });
}

export async function forgetAccount(address: string): Promise<boolean> {
  return sendMessage("pri(accounts.forget)", { address });
}

export async function subscribeAccounts(
  cb: (accounts: extLib.AccountJson[]) => void
): Promise<boolean> {
  return sendMessage("pri(accounts.subscribe)", null, cb);
}

export async function selectAccount(address: string): Promise<boolean> {
  return sendMessage("pri(accounts.select)", { address });
}

export async function validateAccount(
  address: string,
  password: string
): Promise<boolean> {
  return sendMessage("pri(accounts.validate)", { address, password });
}

export async function subscribeSelectedAccount(
  cb: (selected: extLib.AccountJson | undefined) => void
): Promise<boolean> {
  return subscribeAccounts((accounts) => {
    cb(accounts.find((a) => a.isSelected));
  });
}

export async function validateDerivationPath(
  parentAddress: string,
  suri: string,
  parentPassword: string
): Promise<ResponseDeriveValidate> {
  return sendMessage("pri(derivation.validate)", {
    parentAddress,
    parentPassword,
    suri,
  });
}

export async function deriveAccount(
  parentAddress: string,
  suri: string,
  parentPassword: string,
  name: string,
  password: string
): Promise<boolean> {
  return sendMessage("pri(derivation.create)", {
    name,
    parentAddress,
    parentPassword,
    password,
    suri,
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
