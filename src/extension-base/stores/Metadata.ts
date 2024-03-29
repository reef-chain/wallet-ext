// Adapted from @polkadot/extension-base (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import { extension as extLib } from '@reef-chain/util-lib';

import BaseStore from "./Base";

export default class MetadataStore extends BaseStore<extLib.MetadataDef> {
  constructor() {
    super("metadata");
  }
}
