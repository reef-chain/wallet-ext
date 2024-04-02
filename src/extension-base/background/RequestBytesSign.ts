// Adapted from @polkadot/extension (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import type { KeyringPair } from "@polkadot/keyring/types";
import type { HexString } from "@polkadot/util/types";
import type { SignerPayloadRaw } from "@polkadot/types/types";
import type { RequestSign } from "./types";

import { u8aToHex, u8aWrapBytes } from "@polkadot/util";
import { TypeRegistry } from "@polkadot/types";

export default class RequestBytesSign implements RequestSign {
  public readonly payload: SignerPayloadRaw;

  constructor(payload: SignerPayloadRaw) {
    this.payload = payload;
  }

  sign(_registry: TypeRegistry, pair: KeyringPair): { signature: HexString } {
    return {
      signature: u8aToHex(pair.sign(u8aWrapBytes(this.payload.data))),
    };
  }
}