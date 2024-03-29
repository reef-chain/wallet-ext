// Adapted from @polkadot/extension (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import { extension as extLib } from '@reef-chain/util-lib';

import type { SendRequest } from "./types";

// External to class, this.# is not private enough (yet)
let sendRequest: SendRequest;

export default class Metadata implements extLib.InjectedMetadata {
  constructor(_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  public get(): Promise<extLib.InjectedMetadataKnown[]> {
    return sendRequest("pub(metadata.list)");
  }

  public provide(definition: extLib.MetadataDef): Promise<boolean> {
    return sendRequest("pub(metadata.provide)", definition);
  }
}
