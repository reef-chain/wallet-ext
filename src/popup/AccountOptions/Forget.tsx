import React, { useContext } from "react";
import { useParams } from "react-router";

import Account from "../Accounts/Account";
import { forgetAccount } from "../messaging";
import { AccountsContext, ActionContext } from "../contexts";
import { SectionTitle } from "../components/SectionTitle";
import { WarnMessage } from "../components/WarnMessage";

export const Forget = (): JSX.Element => {
  const { address } = useParams();
  const { accounts } = useContext(AccountsContext);
  const onAction = useContext(ActionContext);

  const name =
    accounts.find((account) => account.address === address)?.name || "";

  const forget = async () => {
    try {
      await forgetAccount(address);
      onAction("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <SectionTitle text="Forget account" />
      <div className="flex flex-col">
        <Account account={{ address, name }} showCopyAddress={true} />
        <WarnMessage
          text="You are about to remove the account. This means that you will not be able to access it via this extension anymore. 
          If you wish to recover it, you would need to use the seed."
        />
        <button onClick={() => forget()}>Forget account</button>
      </div>
    </>
  );
};
