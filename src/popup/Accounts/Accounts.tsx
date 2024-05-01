import React, { useContext } from "react";

import Account from "./Account";
import { AccountsContext, ActionContext, ProviderContext } from "../contexts";
import { Loading } from "../components/Loading";
import Uik from "@reef-chain/ui-kit";
import { useTheme } from "../context/ThemeContext";

const Accounts = (): JSX.Element => {
  const { accounts, selectedAccount } = useContext(AccountsContext);
  const provider = useContext(ProviderContext);
  const onAction = useContext(ActionContext);
  const { isDarkMode } = useTheme();
  return (
    <>
      {/* Loading */}
      {(!accounts || (accounts.length > 0 && !provider)) && (
        <div className="mt-16">
          <Uik.Loading />
        </div>
      )}
      {/* No accounts */}
      {accounts?.length === 0 && (
        <>
          <Uik.Text text="No accounts available." type="title" className={`${isDarkMode ? "text--dark-mode" : ""}`} />
          <Uik.Button onClick={() => onAction("account/menu")} text="Add account" />
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
