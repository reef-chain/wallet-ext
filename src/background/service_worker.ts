// Adapted from @polkadot/extension (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

// Runs in the extension service worker, handling all keyring access

import type {
  RequestSignatures,
  TransportRequestMessage,
} from "../extension-base/background/types";

import { cryptoWaitReady } from "@polkadot/util-crypto";
import { assert } from "@polkadot/util";
import keyring from "@polkadot/ui-keyring";

import handlers from "../extension-base/background/handlers";
import { PORT_CONTENT, PORT_EXTENSION } from "../extension-base/defaults";
import { LocalStore } from "../extension-base/localStore";

// Fix Service Worker disconnection: https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269#66618269
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

// listen to all messages and handle appropriately
chrome.runtime.onConnect.addListener((port): void => {
  console.log("msg connect listener before handler=", port);
  // shouldn't happen, however... only listen to what we know about
  assert(
    [PORT_CONTENT, PORT_EXTENSION].includes(port.name),
    `Unknown connection from ${port.name}`
  );

  // message and disconnect handlers
  port.onMessage.addListener(
    (data: TransportRequestMessage<keyof RequestSignatures>) => {
      console.log("[ServiceWorker receives]", " port=", port.name, data);
      handlers(data, port);
    }
  );
  port.onDisconnect.addListener(() =>
    console.log(`Disconnected from ${port.name}`)
  );
});

// initial setup
cryptoWaitReady()
  .then((): void => {
    console.log("crypto initialized");

    // load all the keyring data
    keyring.loadAll({ store: new LocalStore(), type: "sr25519" });
    console.log("KEYRING LOADED ALL=", keyring.getAccounts().length);
    console.log("initialization completed");
  })
  .catch((error): void => {
    console.error("initialization failed", error);
  });
