// Adapted from @polkadot/extension-base (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import { extension as extLib } from '@reef-chain/util-lib';

const metadataGets = new Map<string, Promise<extLib.MetadataDef | null>>();

export function getSavedMeta(
  genesisHash: string
): Promise<extLib.MetadataDef | null> | undefined {
  return metadataGets.get(genesisHash);
}

export function setSavedMeta(
  genesisHash: string,
  def: Promise<extLib.MetadataDef | null>
): Map<string, Promise<extLib.MetadataDef | null>> {
  return metadataGets.set(genesisHash, def);
}
