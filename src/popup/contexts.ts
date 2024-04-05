import { createContext } from "react";
import { extension as extLib } from "@reef-chain/util-lib";
import { AccountWithSigner } from "./types";

const noop = (): void => undefined;

type AccountsCtx = {
  accounts: extLib.AccountJson[];
  selectedAccount: null | extLib.AccountJson;
  accountsWithSigners: AccountWithSigner[];
};

const AccountsContext = createContext<AccountsCtx>({
  accounts: [],
  selectedAccount: null,
  accountsWithSigners: [],
});
const ActionContext = createContext<(to?: string) => void>(noop);

export { AccountsCtx, AccountsContext, ActionContext };
