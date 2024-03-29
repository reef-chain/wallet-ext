// Adapted from @polkadot/extension (https://github.com/polkadot-js/extension)
// SPDX-License-Identifier: Apache-2.0

import { extension as extLib } from '@reef-chain/util-lib';

import Accounts from "./Accounts";
import Metadata from "./Metadata";
import PostMessageProvider from "./PostMessageProvider";
import { ReefProvider } from "./ReefProvider";
import { ReefSigner } from "./ReefSigner";
import Signer from "./Signer";

export default class implements extLib.ReefInjected {
  public readonly accounts: Accounts;
  public readonly metadata: Metadata;
  public readonly provider: PostMessageProvider;
  public readonly signer: Signer;
  public readonly reefSigner: ReefSigner;
  public readonly reefProvider: ReefProvider;

  constructor(sendRequest: any) {
    this.accounts = new Accounts(sendRequest);
    this.metadata = new Metadata(sendRequest);
    this.provider = new PostMessageProvider(sendRequest);
    this.signer = new Signer(sendRequest);
    this.reefProvider = new ReefProvider(sendRequest);
    this.reefSigner = new ReefSigner(
      this.accounts,
      this.signer,
      this.reefProvider
    );
  }
}
