// Adapted from @polkadot/extension-chains (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import type { Chain } from "./types";

import { base64Decode } from "@polkadot/util-crypto";
import { extension as extLib } from '@reef-chain/util-lib';
import { Metadata, TypeRegistry } from "@polkadot/types";

import { reefMetadataMainnet, reefMetadataTestnet } from "./ReefMetadata";


// imports chain details, generally metadata. For the generation of these,
// inside the api, run `yarn chain:info --ws <url>`

const definitions = new Map<string, extLib.MetadataDef>();
definitions.set(reefMetadataTestnet.genesisHash, reefMetadataTestnet);
definitions.set(reefMetadataMainnet.genesisHash, reefMetadataMainnet);

const expanded = new Map<string, Chain>();

export function metadataExpand(
  definition: extLib.MetadataDef,
  isPartial = false
): Chain {
  const cached = expanded.get(definition.genesisHash);

  if (cached && cached.specVersion === definition.specVersion) {
    return cached;
  }

  const {
    chain,
    genesisHash,
    icon,
    metaCalls,
    specVersion,
    ss58Format,
    tokenDecimals,
    tokenSymbol,
    types,
    userExtensions,
  } = definition;
  const registry = new TypeRegistry();

  if (!isPartial) {
    registry.register(types);
  }

  registry.setChainProperties(
    registry.createType("ChainProperties", {
      ss58Format,
      tokenDecimals,
      tokenSymbol,
    })
  );

  const hasMetadata = !!metaCalls && !isPartial;

  if (hasMetadata) {
    // @ts-ignore
    registry.setMetadata(
      new Metadata(registry, base64Decode(metaCalls || "")),
      undefined,
      userExtensions
    );
  }

  const isUnknown = genesisHash === "0x";

  const result = {
    definition,
    genesisHash: isUnknown ? undefined : genesisHash,
    hasMetadata,
    icon: icon || "substrate",
    isUnknown,
    name: chain,
    registry,
    specVersion,
    ss58Format,
    tokenDecimals,
    tokenSymbol,
  };

  if (result.genesisHash && !isPartial) {
    expanded.set(result.genesisHash, result);
  }

  return result;
}

export function findChain(
  definitions: extLib.MetadataDef[],
  genesisHash?: string | null
): Chain | null {
  const def = definitions.find((def) => def.genesisHash === genesisHash);

  return def ? metadataExpand(def) : null;
}

export function addMetadata(def: extLib.MetadataDef): void {
  definitions.set(def.genesisHash, def);
}

export function knownMetadata(): extLib.MetadataDef[] {
  return [...definitions.values()];
}
