import React, { useContext } from "react";

import Account from "./Account";
import { AccountsContext, ActionContext, ProviderContext } from "../contexts";

const Accounts = (): JSX.Element => {
  const { accounts, selectedAccount } = useContext(AccountsContext);
  const provider = useContext(ProviderContext);
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
          isSelected={true}
          showOptions={true}
          showCopyAddress={true}
        />
      )}
      {/* Other accounts */}
      <div className="max-h-[365px] overflow-y-scroll scrollbar-hidden rounded-xl">
        {accounts?.length > 1 &&
          provider &&
          accounts
            .filter((account) => account.address !== selectedAccount.address)
            .map((account) => (
              <Account
                key={account.address}
                account={account}
                showOptions={true}
                showCopyAddress={true}
              />
            ))}
      </div>
    </>
  );
};

export default Accounts;
