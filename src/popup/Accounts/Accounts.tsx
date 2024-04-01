import React, { useContext } from "react";
import { Provider } from "@reef-chain/evm-provider";

import { AccountJson } from "../../extension-base/background/types";
import Account from "./Account";
import { ActionContext } from "../contexts";

interface Props {
  accounts: AccountJson[];
  provider?: Provider;
  selectedAccount?: AccountJson;
}

const Accounts = ({
  accounts,
  provider,
  selectedAccount,
}: Props): JSX.Element => {
  const onAction = useContext(ActionContext);

  return (
    <>
      {/* Loading */}
      {(!accounts || (accounts.length > 0 && !provider)) && (
        <div className="text-lg mt-12">Loading...</div>
      )}
      {/* No accounts */}
      {accounts?.length === 0 && (
        <>
          <div className="text-lg mt-12">No accounts available.</div>
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
