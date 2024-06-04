import React, { useContext } from "react";

import Account from "./Account";
import { AccountsContext, ActionContext, ProviderContext } from "../contexts";
import Uik from "@reef-chain/ui-kit";
import strings from "../../i18n/locales";
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

          <Uik.Text text={strings.no_accs_available} type="title" className={`${isDarkMode ? "text--dark-mode" : ""}`} />
          <Uik.Button onClick={() => onAction("account/menu")} text={strings.add_acc} />
        </>
      )}
      {/* Selected account */}
      {
        selectedAccount && provider && (
          <>
            <Uik.Text text={"Selected"} className={`${isDarkMode ? "text--dark-mode" : ""}`} />
            <Account
              account={selectedAccount}
              isSelected={true}
              showOptions={true}
              showCopyAddress={true}
            />
          </>
        )
      }
      {/* Other accounts */}
      <div className="max-h-[365px] overflow-y-scroll scrollbar-hidden rounded-xl">
        {accounts?.length > 1 && provider && <Uik.Text text={"Accounts"} className={`mt-2 ${isDarkMode ? "text--dark-mode" : ""}`} />}
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
                showSelect={true}
              />
            )
            )}
      </div>
    </>
  );
};

export default Accounts;
