// Adapted from @polkadot/extension (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import type { MessageTypes, TransportRequestMessage } from "../types";

import { assert } from "@polkadot/util";

import Tabs from "./Tabs";
import Extension from "./Extension";
import { PORT_EXTENSION } from "../../defaults";
import State from "./State";

const state = new State();
const extension = new Extension(state);
const tabs = new Tabs(state);

export default function handler<TMessageType extends MessageTypes>(
  { id, message, request }: TransportRequestMessage<TMessageType>,
  port: chrome.runtime.Port,
  extensionPortName = PORT_EXTENSION
): void {
  const isExtension = port.name === extensionPortName;
  const sender = port.sender as chrome.runtime.MessageSender;
  const from = isExtension
    ? extensionPortName
    : (sender.tab && sender.tab.url) || sender.url || "<unknown>";
  const source = `${from}: ${id}: ${message}`;

  console.log(` [in] ${source}`); // :: ${JSON.stringify(request)}`);
  const promise =
    isExtension &&
    message !== "pub(extrinsic.sign)" &&
    message !== "pub(bytes.sign)"
      ? extension.handle(id, message, request, port)
      : tabs.handle(id, message, request, from, port);

  promise
    .then((response): void => {
      console.log(`[out] ${source}`); // :: ${JSON.stringify(response)}`);

      // between the start and the end of the promise, the user may have closed
      // the tab, in which case port will be undefined
      assert(port, "Port has been disconnected");

      port.postMessage({ id, response });
    })
    .catch((error: Error): void => {
      console.log(`[err] ${source}:: ${error.message}`);

      // only send message back to port if it's still connected
      if (port) {
        port.postMessage({ error: error.message, id });
      }
    });
}
