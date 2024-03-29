// Adapted from @polkadot/extension-chains (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import type { Registry } from "@polkadot/types/types";

import { extension as extLib } from '@reef-chain/util-lib';

export interface Chain {
  definition: extLib.MetadataDef;
  genesisHash?: string;
  hasMetadata: boolean;
  icon: string;
  isUnknown?: boolean;
  name: string;
  registry: Registry;
  specVersion: number;
  ss58Format: number;
  tokenDecimals: number;
  tokenSymbol: string;
}
