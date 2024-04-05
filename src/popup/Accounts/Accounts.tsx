import React, { useContext } from "react";
import { Provider } from "@reef-chain/evm-provider";
import { extension as extLib } from "@reef-chain/util-lib";

import Account from "./Account";
import { AccountsContext, ActionContext } from "../contexts";

interface Props {
  provider?: Provider;
}

const Accounts = ({ provider }: Props): JSX.Element => {
  const { accounts, selectedAccount } = useContext(AccountsContext);
  const onAction = useContext(ActionContext);

  return (
    <>
      {/* Loading */}
      {(!accounts || (accounts.length > 0 && !provider)) && (
        <div className="text-lg mt-12">Loading accounts...</div>
      )}
      {/* No accounts */}
      {accounts?.length === 0 && (
        <>
          <div className="text-lg my-8 text-center">No accounts available.</div>
          <button onClick={() => onAction("account/menu")}>Add account</button>
        </>
      )}
      {/* Selected account */}
      {selectedAccount && provider && (
        <Account
          account={selectedAccount}
          provider={provider}
          isSelected={true}
        />
      )}
      {/* Other accounts */}
      {accounts?.length > 1 &&
        provider &&
        accounts
          .filter((account) => account.address !== selectedAccount.address)
          .map((account) => (
            <Account
              key={account.address}
              account={account}
              provider={provider}
            />
          ))}
    </>
  );
};

export default Accounts;
