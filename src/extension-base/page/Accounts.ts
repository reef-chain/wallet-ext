import { extension as extLib } from '@reef-chain/util-lib';

import { SendRequest } from "./types";

let sendRequest: SendRequest;

export default class Accounts {
  constructor(_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  public get(): Promise<extLib.InjectedAccount[]> {
    return sendRequest("pub(accounts.list)");
  }

  public subscribe(cb: (accounts: extLib.InjectedAccount[]) => unknown): extLib.Unsubcall {
    let unsubs = false;

    sendRequest("pub(accounts.subscribe)", null, (val) => {
      if (!unsubs) {
        cb(val);
      }
    }).catch((error: Error) => console.error(error));

    return (): void => {
      unsubs = true;
    };
  }
}
