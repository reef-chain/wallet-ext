import React, { useState } from "react";
import { extension as extLib } from "@reef-chain/util-lib";

import Account from "./Account";

interface Props {
  initialSelection: extLib.AccountJson | null;
  accounts: extLib.AccountJson[];
  onAccountSelect: (account: extLib.AccountJson) => void;
  small?: boolean;
}

const AccountSelector = ({
  initialSelection,
  accounts,
  onAccountSelect,
  small,
}: Props): JSX.Element => {
  const [selectedAccount, setSelectedAccount] = useState(
    initialSelection || accounts[0]
  );
  const [showAvailableAccounts, setShowAvailableAccounts] = useState(false);

  const accountSelected = (account: extLib.AccountJson) => {
    setSelectedAccount(account);
    onAccountSelect(account);
    setShowAvailableAccounts(false);
  };

  const toggleAvailableAccounts = () => {
    setShowAvailableAccounts(!showAvailableAccounts);
  };

  return (
    <>
      <Account
        key={selectedAccount.address}
        account={selectedAccount}
        onClick={accounts.length > 1 ? toggleAvailableAccounts : undefined}
        showCopyAddress={true}
        className="account-box-padding"
      />
      {showAvailableAccounts && (
        <div className="relative">
          <div
            className={`absolute bg-neutral-900 px-3 overflow-y-scroll rounded-xl w-full shadow-2xl
             ${small ? "max-h-[120px]" : "max-h-[340px]"}`}
          >
            {accounts
              .filter((account) => account.address !== selectedAccount?.address)
              .map((account) => (
                <Account
                  key={account.address}
                  account={account}
                  onClick={accountSelected}
                  className="account-box-padding"
                />
              ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AccountSelector;
