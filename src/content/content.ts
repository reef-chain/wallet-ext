// Adapted from @polkadot/extension (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import type { Message } from "../extension-base/types";

import { PORT_CONTENT, PORT_PAGE } from "../extension-base/defaults";

let port: chrome.runtime.Port;

// connect to the extension
const connect = () => {
  port = chrome.runtime.connect({ name: PORT_CONTENT });

  // send any messages from the extension back to the page
  port.onMessage.addListener((data): void => {
    console.log(
      "[Content receives port.onMessage - sends window.postMessage]",
      data
    );
    window.postMessage({ ...data, origin: PORT_CONTENT }, "*");
  });
};

connect();

// all messages from the page, pass them to the extension
window.addEventListener("message", ({ data, source }: Message): void => {
  // only allow messages from our window, by the inject
  if (source !== window || data.origin !== PORT_PAGE) {
    return;
  }
  console.log(
    "[Content receives window.addEventListener - sends port.postMessage]",
    data,
    " source=",
    source
  );
  port.postMessage(data);
});

// inject our data injector
const script = document.createElement("script");

script.src = chrome.runtime.getURL("page.js");

script.onload = (): void => {
  // remove the injecting tag when loaded
  if (script.parentNode) {
    script.parentNode.removeChild(script);
  }
};

(document.head || document.documentElement).appendChild(script);
